import React from 'react';
import './RecommendedActions.css';

export default function RecommendedActions({ actions, company, opportunityType, evidenceSignals = [] }) {
  if (!actions || actions.length === 0) return null;

  const hasValidCompany = company && company !== 'Unknown' && company !== 'UNKNOWN' && company.trim() !== '';
  const cleanCompany = hasValidCompany ? company.trim() : '';

  // Check if AICTE or government is referenced in any signal
  const hasAicteSignal = (evidenceSignals || []).some(
    (s) => (s.rule_id === 'R13') || 
           (s.title && s.title.toLowerCase().includes('government')) || 
           (s.explanation && s.explanation.toLowerCase().includes('aicte'))
  );

  const websiteSearchUrl = hasValidCompany
    ? `https://www.google.com/search?q=${encodeURIComponent(cleanCompany + ' official careers website')}`
    : 'https://www.google.com/search?q=internship+job+offer+verification';

  const complaintsSearchUrl = hasValidCompany
    ? `https://www.google.com/search?q=${encodeURIComponent(cleanCompany + ' scam complaints reviews fraud')}`
    : 'https://www.google.com/search?q=job+scam+complaints+and+reporting';

  return (
    <div className="recommended-actions">
      <div className="result-section-header">
        <h2 className="result-section-title">What you should do next</h2>
        <p className="result-section-sub">
          {hasValidCompany
            ? `Practical verification steps tailored for this ${opportunityType || 'opportunity'} from ${cleanCompany}.`
            : 'Practical steps to verify the opportunity before proceeding.'}
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

      {/* Useful Verification Action Tools */}
      <div className="actions-buttons-container">
        <span className="actions-buttons-label">Instant Verification Tools:</span>
        <div className="actions-buttons">
          <a
            id="find-website-btn"
            className="action-tool-link"
            href={websiteSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            {hasValidCompany ? `Search "${cleanCompany}" Website` : 'Find official website'}
            <span className="external-arrow" aria-hidden="true">↗</span>
          </a>

          <a
            id="search-complaints-btn"
            className="action-tool-link"
            href={complaintsSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            {hasValidCompany ? `Search "${cleanCompany}" Complaints` : 'Search company complaints'}
            <span className="external-arrow" aria-hidden="true">↗</span>
          </a>

          {hasAicteSignal && (
            <a
              id="aicte-verify-btn"
              className="action-tool-link link-highlight"
              href="https://internship.aicte-india.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Verify on AICTE Portal
              <span className="external-arrow" aria-hidden="true">↗</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
