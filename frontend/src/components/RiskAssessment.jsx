import React, { useEffect, useState, useRef } from 'react';
import EvidenceCard from './EvidenceCard';
import ExtractedFacts from './ExtractedFacts';
import RecommendedActions from './RecommendedActions';
import VerificationInfo from './VerificationInfo';
import FeedbackSection from './FeedbackSection';
import './RiskAssessment.css';

const RISK_CONFIG = {
  LOW: { 
    label: 'Low Risk', 
    className: 'risk-low', 
    color: 'var(--color-risk-low)', 
    tagline: 'No major warning signals were identified from the available information.'
  },
  MODERATE: { 
    label: 'Moderate Risk', 
    className: 'risk-medium', 
    color: 'var(--color-risk-medium)', 
    tagline: 'Some warning signals were identified. Verify important claims before proceeding.'
  },
  HIGH: { 
    label: 'High Risk', 
    className: 'risk-high', 
    color: 'var(--color-risk-high)', 
    tagline: 'Multiple strong warning signals were identified. Exercise significant caution before proceeding.'
  },
  'VERY HIGH': {
    label: 'Very High Risk',
    className: 'risk-very-high',
    color: 'var(--color-risk-high)',
    tagline: 'Severe warning signals were identified. Strong indication of an unsafe opportunity.'
  }
};

function useCounter(target, duration = 1200) {
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
  const config = RISK_CONFIG[result.riskLevel?.toUpperCase()] || RISK_CONFIG.HIGH;
  const animatedScore = useCounter(result.riskScore);

  return (
    <section className="assessment-section animate-fade-in">
      <div className="assessment-inner stagger-children">

        {/* ── Top bar ── */}
        <div className="assessment-topbar">
          <button id="analyse-another-btn" className="btn-ghost-nav" onClick={onReset} type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Analyse another opportunity
          </button>
        </div>

        {/* ── Prominent Verdict Banner ── */}
        <div className={`verdict-banner verdict-${(result.riskLevel || 'high').toLowerCase().replace(/\s+/g, '-')}`}>
          <div className="verdict-badge-row">
            <span className="verdict-icon">
              {result.riskScore >= 50 ? '🚨' : result.riskScore >= 25 ? '⚠️' : '✅'}
            </span>
            <span className="verdict-title">
              {result.riskScore >= 75
                ? 'CRITICAL SCAM WARNING — DO NOT PROCEED'
                : result.riskScore >= 50
                ? 'HIGH RISK OFFER — SUSPICIOUS PATTERNS FOUND'
                : result.riskScore >= 25
                ? 'MODERATE RISK — INDEPENDENT VERIFICATION NEEDED'
                : 'LOW RISK OPPORTUNITY — STANDARD RECRUITMENT'}
            </span>
          </div>
          <p className="verdict-subtitle">
            {result.riskScore >= 75
              ? 'This opportunity contains severe predatory warning signs. Do not pay any registration, training, or deposit fees, and do not share identity documents.'
              : result.riskScore >= 50
              ? 'Multiple concerning signals were detected. Carefully review the red flags before applying or responding.'
              : result.riskScore >= 25
              ? 'Some irregular recruitment practices were detected. Verify the recruiter through official company channels.'
              : 'No major deceptive patterns were identified from the available information. Proceed with standard career diligence.'}
          </p>
        </div>

        {/* ── Risk Header ── */}
        <div className={`risk-panel ${config.className}`}>
          <div className="risk-panel-top">
            <div className="risk-score-display">
              <span className="risk-score-num">{animatedScore}</span>
              <span className="risk-score-denom">/100</span>
            </div>
            <div className="risk-info">
              <span className="risk-indicator-label">RISK INDICATOR</span>
              <span className={`risk-level-badge ${config.className}`}>{config.label}</span>
              <p className="risk-tagline">{config.tagline}</p>
              {result.evidenceSignals.length > 0 && (
                <p className="risk-signal-count">{result.evidenceSignals.length} warning signal{result.evidenceSignals.length !== 1 ? 's' : ''} identified</p>
              )}
            </div>
          </div>
          
          {/* Horizontal Scale */}
          <div className="risk-scale-wrap">
            <div className="risk-scale-labels">
              <span>Low</span>
              <span>Moderate</span>
              <span>High</span>
            </div>
            <div className="risk-scale-track">
              <div 
                className="risk-scale-marker" 
                style={{ left: `${Math.min(Math.max(result.riskScore, 2), 98)}%` }} 
              />
            </div>
          </div>

          <div className="risk-caveat-box">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <span>This indicator highlights warning signals in the submitted information. It is not proof of fraud.</span>
          </div>
        </div>

        {/* ── Opportunity summary ── */}
        <div className="result-section">
          <h2 className="result-section-title">Opportunity summary</h2>
          <div className="summary-grid">
            {Object.entries(result.opportunitySummary).map(([key, value]) => {
              // Convert camelCase to title case
              const formattedKey = key.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^./, c => c.toUpperCase());
              const isNeutral = value && (value.toLowerCase() === 'unknown' || value.toLowerCase() === 'not provided' || value.toLowerCase() === 'not identified');
              
              return (
                <div key={key} className="summary-item">
                  <span className="summary-key">{formattedKey}</span>
                  <span className={`summary-value ${isNeutral ? 'value-neutral' : ''}`}>{value || 'Not specified'}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Core Reasons & Evidence ── */}
        <div className="result-section">
          <div className="result-section-header">
            <h2 className="result-section-title">Why this opportunity was flagged</h2>
            <p className="result-section-sub">
              Each warning signal is linked directly to supporting evidence quoted from the submitted text.
            </p>
          </div>

          {result.evidenceSignals && result.evidenceSignals.length > 0 && (
            <div className="key-reasons-summary">
              <h3 className="key-reasons-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Key Flagged Reasons Summary
              </h3>
              <ul className="key-reasons-list">
                {result.evidenceSignals.map((sig) => (
                  <li key={sig.id} className="key-reason-item">
                    <div className="reason-content">
                      <div className="reason-header">
                        <span className="reason-title">{sig.title}</span>
                        <span className={`reason-pts pts-${(sig.severity || 'low').toLowerCase()}`}>+{sig.points} pts</span>
                      </div>
                      <p className="reason-desc">{sig.explanation}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="evidence-list stagger-children">
            {result.evidenceSignals.map((sig) => (
              <EvidenceCard key={sig.id} {...sig} riskLevel={result.riskLevel} />
            ))}
          </div>
        </div>

        {/* ── Why this opportunity may be safe / Positive signals ── */}
        <div className="result-section">
          <div className="result-section-header">
            <h2 className="result-section-title">Why this opportunity may be safe</h2>
            <p className="result-section-sub">
              Positive trust markers and legitimate hiring indicators identified from the submitted text.
            </p>
          </div>

          {result.safeSignals && result.safeSignals.length > 0 ? (
            <div className="key-reasons-summary key-safe-summary">
              <h3 className="key-reasons-title key-safe-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <polyline points="9 12 11 14 15 10"/>
                </svg>
                Key Safe Indicators Summary
              </h3>
              <ul className="key-reasons-list">
                {result.safeSignals.map((sig) => (
                  <li key={sig.id} className="key-reason-item key-safe-item">
                    <div className="reason-content">
                      <div className="reason-header">
                        <span className="reason-title">{sig.title}</span>
                        <span className="reason-pts pts-safe">+{sig.points} pts</span>
                      </div>
                      <p className="reason-desc">{sig.explanation}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="no-safe-signals-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>No verified safety signals detected in this submission. Exercise heightened caution before proceeding.</span>
            </div>
          )}
        </div>

        {/* ── Risk Calculation ── */}
        <div className="result-section">
          <details className="risk-calc-details">
            <summary className="risk-calc-summary">
              <span className="calc-summary-text">How the risk indicator was calculated</span>
              <svg className="calc-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </summary>
            <div className="risk-calc-content">
              <p className="calc-intro">The risk indicator is based on the warning signals identified in the submitted information.</p>
              <div className="calc-breakdown">
                {result.evidenceSignals.map((sig) => (
                  <div key={sig.id} className="calc-row">
                    <span className="calc-label">{sig.title}</span>
                    <span className="calc-points">+{sig.points}</span>
                  </div>
                ))}
                <div className="calc-row calc-total">
                  <span className="calc-label">Total Indicator</span>
                  <span className="calc-points">{result.riskScore}</span>
                </div>
              </div>
            </div>
          </details>
        </div>

        {/* ── Extracted Facts ── */}
        <div className="result-section">
          <ExtractedFacts facts={result.extractedFacts} />
        </div>

        {/* ── Recommended Actions ── */}
        <div className="result-section">
          <RecommendedActions 
            actions={result.recommendedActions}
            company={result.opportunitySummary?.company}
            opportunityType={result.opportunitySummary?.category}
            evidenceSignals={result.evidenceSignals}
          />
        </div>

        {/* ── Verification Info ── */}
        <div className="result-section">
          <VerificationInfo info={result.verificationInfo} />
        </div>

        {/* ── Feedback ── */}
        <div className="result-section">
          <FeedbackSection />
        </div>

      </div>
    </section>
  );
}
