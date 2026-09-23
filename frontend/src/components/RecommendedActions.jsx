import React from 'react';
import './RecommendedActions.css';

export default function RecommendedActions({ actions, company, opportunityType, evidenceSignals = [] }) {
  if (!actions || actions.length === 0) return null;

  const hasValidCompany = company && company !== 'Unknown' && company !== 'UNKNOWN' && company.trim() !== '' && company !== 'Unspecified Entity';
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
    <div className="protocol-card">
      <div className="protocol-header">
        <div className="protocol-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 11 12 14 22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          <span>Action Protocol</span>
        </div>
        <h3 className="protocol-title">Recommended Safety Checklist</h3>
        <p className="protocol-sub">
          {hasValidCompany
            ? `Follow these independent steps before responding or sharing documents with ${cleanCompany}.`
            : 'Follow these independent verification steps before responding.'}
        </p>
      </div>

      <div className="protocol-steps">
        {actions.map((action, i) => (
          <div key={i} className="protocol-step-row">
            <div className="step-badge">{String(i + 1).padStart(2, '0')}</div>
            <p className="step-text">{action}</p>
          </div>
        ))}
      </div>

      {/* Instant Verification Launchers */}
      <div className="protocol-tools-area">
        <span className="tools-area-label">Instant Verification Launchers</span>
        <div className="tools-buttons-row">
          {hasValidCompany && (
            <a
              id="verify-linkedin-btn"
              className="protocol-tool-btn"
              href={`https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(cleanCompany)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                <rect x="2" y="9" width="4" height="12"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
              <span>Verify on LinkedIn</span>
              <span className="tool-arrow">↗</span>
            </a>
          )}

          {hasValidCompany && (
            <a
              id="verify-wellfound-btn"
              className="protocol-tool-btn"
              href={`https://wellfound.com/search?q=${encodeURIComponent(cleanCompany)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span>Startup Ecosystem (Wellfound)</span>
              <span className="tool-arrow">↗</span>
            </a>
          )}

          <a
            id="find-website-btn"
            className="protocol-tool-btn"
            href={websiteSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <span>{hasValidCompany ? `Search "${cleanCompany}" Website` : 'Find Official Website'}</span>
            <span className="tool-arrow">↗</span>
          </a>

          <a
            id="search-complaints-btn"
            className="protocol-tool-btn"
            href={complaintsSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>{hasValidCompany ? `Check "${cleanCompany}" Complaints` : 'Search Complaints'}</span>
            <span className="tool-arrow">↗</span>
          </a>

          {hasAicteSignal && (
            <a
              id="aicte-verify-btn"
              className="protocol-tool-btn tool-btn-highlight"
              href="https://internship.aicte-india.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>AICTE Official Portal</span>
              <span className="tool-arrow">↗</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
