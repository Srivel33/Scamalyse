import React, { useState, useEffect, useRef } from 'react';
import EvidenceCard from './EvidenceCard';
import RecommendedActions from './RecommendedActions';
import VerificationInfo from './VerificationInfo';
import FeedbackSection from './FeedbackSection';
import './RiskAssessment.css';

const RISK_THEMES = {
  LOW: {
    label: 'Low Risk',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
    headline: 'Standard Recruitment Patterns Detected',
    summary: 'No critical predatory signals were identified from the available data. Proceed with standard career diligence.',
  },
  MODERATE: {
    label: 'Moderate Risk',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
    headline: 'Caution Advised — Verify Key Claims',
    summary: 'Some irregular or unverifiable signals were detected. Verify the recruiter through official company channels before sharing personal details.',
  },
  HIGH: {
    label: 'High Risk',
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
    headline: 'Suspicious Predatory Patterns Found',
    summary: 'Multiple deceptive markers or unverified entity patterns were identified. Exercise extreme caution and do not pay any upfront fees.',
  },
  'VERY HIGH': {
    label: 'Critical Warning',
    color: '#DC2626',
    bgColor: 'rgba(220, 38, 38, 0.1)',
    borderColor: 'rgba(220, 38, 38, 0.3)',
    headline: 'Critical Fraud Threat — Do Not Proceed',
    summary: 'Severe predatory scam indicators identified. High probability of financial advance-fee fraud or credential phishing. Discontinue contact.',
  },
};

function useCounter(target, duration = 1000) {
  const [count, setCount] = useState(0);
  const ref = useRef();
  useEffect(() => {
    let start = 0;
    const startTime = performance.now();
    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) ref.current = requestAnimationFrame(tick);
    }
    ref.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current);
  }, [target, duration]);
  return count;
}

export default function RiskAssessment({ result, onReset }) {
  const [activeTab, setActiveTab] = useState('all');
  const [copied, setCopied] = useState(false);

  const levelKey = (result.riskLevel || 'high').toUpperCase();
  const theme = RISK_THEMES[levelKey] || (result.riskScore >= 75 ? RISK_THEMES['VERY HIGH'] : RISK_THEMES.HIGH);
  const animatedScore = useCounter(result.riskScore || 0);

  const evidenceSignals = result.evidenceSignals || [];
  const safeSignals = result.safeSignals || [];

  // Filter signals for tabbed view
  const allFindings = [
    ...evidenceSignals.map(s => ({ ...s, isSafe: false })),
    ...safeSignals.map(s => ({ ...s, isSafe: true })),
  ];

  const filteredFindings = activeTab === 'warning'
    ? evidenceSignals.map(s => ({ ...s, isSafe: false }))
    : activeTab === 'safe'
    ? safeSignals.map(s => ({ ...s, isSafe: true }))
    : allFindings;

  // Extract dossier fields cleanly
  const summary = result.opportunitySummary || {};
  const facts = result.extractedFacts || {};

  const companyName = summary.company && summary.company !== 'Unknown' && summary.company !== 'UNKNOWN'
    ? summary.company
    : 'Unspecified Entity';

  const roleTitle = summary.role && summary.role !== 'Unknown' && summary.role !== 'UNKNOWN'
    ? summary.role
    : 'Internship / Task';

  const claimedSalary = summary.salaryClaim && summary.salaryClaim !== 'Not specified' && summary.salaryClaim !== 'UNKNOWN'
    ? summary.salaryClaim
    : (facts.salaryClaim && facts.salaryClaim !== 'Not specified' ? facts.salaryClaim : 'None disclosed');

  const opportunityCategory = summary.category || facts.opportunityType || 'General Opportunity';
  const inputSource = summary.source || 'Submitted offer';

  // SVG Circular progress math
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(result.riskScore, 100) / 100) * circumference;

  const handleCopyReport = () => {
    const reportText = `[Scamalyse Risk Report]
Opportunity: ${companyName} (${roleTitle})
Risk Score: ${result.riskScore}/100 [${theme.label.toUpperCase()}]
Verdict: ${theme.headline}
Warnings Detected: ${evidenceSignals.length}
Trust Factors: ${safeSignals.length}
Verify carefully before sharing sensitive personal details.`;

    navigator.clipboard?.writeText(reportText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <section className="assessment-section animate-fade-in">
      <div className="assessment-inner">

        {/* ── Top Navigation & Meta Bar ── */}
        <div className="assessment-header-bar">
          <button id="analyse-another-btn" className="btn-back-nav" onClick={onReset} type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Scan Another Offer</span>
          </button>

          <div className="header-actions-group">
            <button className="btn-share-report" onClick={handleCopyReport} type="button" title="Copy report summary to clipboard">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Summary'}</span>
            </button>
            <div className="audit-live-tag">
              <span className="live-dot" />
              <span>Audit #{result.analysisMetadata?.analysis_id?.substring(0, 8) || 'VERIFIED'}</span>
            </div>
          </div>
        </div>

        {/* ── Executive Command Center Card (Unified Verdict + Score + Dossier) ── */}
        <div className="executive-card">
          <div className="exec-top-row">
            {/* Circular Gauge */}
            <div className="exec-score-box">
              <div className="score-circle-wrap">
                <svg className="score-svg" viewBox="0 0 130 130">
                  <circle
                    className="score-circle-track"
                    cx="65"
                    cy="65"
                    r={radius}
                  />
                  <circle
                    className="score-circle-bar"
                    cx="65"
                    cy="65"
                    r={radius}
                    stroke={theme.color}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                  />
                </svg>
                <div className="score-number-overlay">
                  <span className="score-current">{animatedScore}</span>
                  <span className="score-max">/100</span>
                </div>
              </div>
              <span className="score-meter-label">Threat Probability</span>
            </div>

            {/* Verdict Headline & Description */}
            <div className="exec-verdict-content">
              <div className="verdict-status-row">
                <span
                  className="verdict-level-pill"
                  style={{ color: theme.color, backgroundColor: theme.bgColor, borderColor: theme.borderColor }}
                >
                  <span className="level-dot" style={{ backgroundColor: theme.color }} />
                  {theme.label}
                </span>
                <span className="threat-summary-stat">
                  {evidenceSignals.length} red flag{evidenceSignals.length !== 1 ? 's' : ''} detected
                </span>
              </div>

              <h1 className="exec-headline">{theme.headline}</h1>
              <p className="exec-summary">{theme.summary}</p>

              {/* Dossier Quick Chips (Replaces redundant tables!) */}
              <div className="dossier-chips-grid">
                <div className="dossier-chip">
                  <span className="chip-icon">🏢</span>
                  <div className="chip-info">
                    <span className="chip-label">Organisation</span>
                    <span className="chip-val">{companyName}</span>
                  </div>
                </div>

                <div className="dossier-chip">
                  <span className="chip-icon">💼</span>
                  <div className="chip-info">
                    <span className="chip-label">Role</span>
                    <span className="chip-val">{roleTitle}</span>
                  </div>
                </div>

                <div className="dossier-chip">
                  <span className="chip-icon">💰</span>
                  <div className="chip-info">
                    <span className="chip-label">Compensation</span>
                    <span className="chip-val">{claimedSalary}</span>
                  </div>
                </div>

                <div className="dossier-chip">
                  <span className="chip-icon">🏷️</span>
                  <div className="chip-info">
                    <span className="chip-label">Category</span>
                    <span className="chip-val" style={{ textTransform: 'capitalize' }}>{opportunityCategory}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Discreet Calculation Math Drawer */}
          <details className="calc-drawer">
            <summary className="calc-drawer-trigger">
              <div className="calc-trigger-left">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                <span>Scoring Math & Rule Breakdown ({evidenceSignals.length + safeSignals.length} rules evaluated)</span>
              </div>
              <svg className="calc-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </summary>

            <div className="calc-drawer-body">
              <p className="calc-note">
                Base risk score is computed by cumulative threat rules firing on linguistic indicators, domain registration age, and corporate registries. Trust factors decrease risk.
              </p>
              <div className="calc-table">
                {evidenceSignals.map(sig => (
                  <div key={sig.id} className="calc-table-row">
                    <span className="calc-item-name">⚠️ {sig.title}</span>
                    <span className="calc-item-pts pts-danger">+{sig.points} pts</span>
                  </div>
                ))}
                {safeSignals.map(sig => (
                  <div key={sig.id} className="calc-table-row">
                    <span className="calc-item-name">🛡️ {sig.title}</span>
                    <span className="calc-item-pts pts-safe">−{sig.points || 10} pts</span>
                  </div>
                ))}
                <div className="calc-table-row calc-row-total">
                  <span>Net Algorithmic Score</span>
                  <span className="calc-total-badge">{result.riskScore} / 100</span>
                </div>
              </div>
            </div>
          </details>
        </div>

        {/* ── Intelligence Findings & Forensic Evidence (Tabbed & Unified) ── */}
        <div className="findings-section animate-fade-in-up">
          <div className="findings-header">
            <div className="findings-header-text">
              <h2 className="findings-title">Intelligence Findings & Forensic Evidence</h2>
              <p className="findings-sub">
                Specific clauses and warning signals extracted directly from your submission.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="findings-filter-tabs" role="tablist" aria-label="Filter intelligence findings">
              <button
                className={`filter-tab ${activeTab === 'all' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('all')}
                type="button"
              >
                All Findings <span className="tab-count">{allFindings.length}</span>
              </button>
              <button
                className={`filter-tab tab-red ${activeTab === 'warning' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('warning')}
                type="button"
              >
                ⚠️ Red Flags <span className="tab-count count-danger">{evidenceSignals.length}</span>
              </button>
              <button
                className={`filter-tab tab-green ${activeTab === 'safe' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('safe')}
                type="button"
              >
                🛡️ Safe Factors <span className="tab-count count-safe">{safeSignals.length}</span>
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="findings-grid">
            {filteredFindings.length > 0 ? (
              filteredFindings.map((sig) => (
                <EvidenceCard
                  key={sig.id}
                  title={sig.title}
                  points={sig.points}
                  severity={sig.severity}
                  evidence={sig.evidence}
                  explanation={sig.explanation}
                  isSafe={sig.isSafe}
                />
              ))
            ) : (
              <div className="empty-findings-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p>No findings found in this category.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Practical Next Steps Checklist ── */}
        <div className="result-section animate-fade-in-up">
          <RecommendedActions
            actions={result.recommendedActions}
            company={companyName}
            opportunityType={opportunityCategory}
            evidenceSignals={evidenceSignals}
          />
        </div>

        {/* ── Technical OSINT & Corporate Verification ── */}
        <div className="result-section animate-fade-in-up">
          <VerificationInfo info={result.verificationInfo} />
        </div>

        {/* ── Community Verification Feedback ── */}
        <div className="result-section animate-fade-in-up">
          <FeedbackSection analysisHash={result.analysisMetadata?.analysis_id} />
        </div>

        {/* ── Clean Floating Bottom Actions ── */}
        <div className="assessment-bottom-cta">
          <button className="btn-large-primary" onClick={onReset} type="button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            <span>Analyse Another Opportunity</span>
          </button>
        </div>

      </div>
    </section>
  );
}
