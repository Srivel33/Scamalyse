import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import AnalyseForm from './components/AnalyseForm';
import AnalysingState from './components/AnalysingState';
import ClarificationState from './components/ClarificationState';
import RiskAssessment from './components/RiskAssessment';
import InfoSections from './components/InfoSections';
import { HIGH_RISK_RESULT } from './data/mockData';
import './App.css';

/**
 * Application states:
 *   'idle'           — initial form
 *   'analysing'      — progress simulation
 *   'clarification'  — single clarification question
 *   'result'         — risk assessment display
 *   'error'          — analysis failed
 */

export default function App() {
  const [appState, setAppState] = useState('idle');
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  // true when the demo flow is triggered (skips clarification)
  const [isDemo, setIsDemo] = useState(false);

  // ── Handlers ──────────────────────────────────────────────

  /** Called by AnalyseForm on real submission */
  const handleSubmit = useCallback((_formData) => {
    setIsDemo(false);
    setResult(null);
    setAppState('analysing');
  }, []);

  /** Called by AnalyseForm "Try a Demo Offer" button */
  const handleDemo = useCallback(() => {
    setIsDemo(true);
    setResult(HIGH_RISK_RESULT);
    setAppState('analysing');
  }, []);

  /** Called by AnalysingState when all steps complete */
  const handleAnalysisComplete = useCallback(() => {
    if (isDemo) {
      // Demo goes straight to result — no clarification needed
      setAppState('result');
    } else {
      // Non-demo: show clarification question if result has one
      // (In Phase 4, this will come from the API response)
      setResult(HIGH_RISK_RESULT); // Mock: always high risk for now
      if (HIGH_RISK_RESULT.clarificationQuestion) {
        setAppState('clarification');
      } else {
        setAppState('result');
      }
    }
  }, [isDemo]);

  /** Called by ClarificationState when user answers or skips */
  const handleClarificationAnswer = useCallback((_answer) => {
    // In Phase 4: re-submit with clarification to API.
    // For now, proceed to result with existing mock data.
    setAppState('result');
  }, []);

  /** Reset to idle / new analysis */
  const handleReset = useCallback(() => {
    setAppState('idle');
    setResult(null);
    setErrorMsg('');
    setIsDemo(false);
    // Scroll back to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ── Render ────────────────────────────────────────────────

  const showInfoSections = appState === 'idle';

  return (
    <div className="app-root">
      <Header />

      <main id="main-content" className="app-main">
        {appState === 'idle' && (
          <AnalyseForm onSubmit={handleSubmit} onDemo={handleDemo} />
        )}

        {appState === 'analysing' && (
          <AnalysingState onComplete={handleAnalysisComplete} />
        )}

        {appState === 'clarification' && result?.clarificationQuestion && (
          <ClarificationState
            question={result.clarificationQuestion}
            onAnswer={handleClarificationAnswer}
          />
        )}

        {appState === 'result' && result && (
          <RiskAssessment result={result} onReset={handleReset} />
        )}

        {appState === 'error' && (
          <div className="error-state animate-fade-in">
            <div className="error-card">
              <span className="error-icon" aria-hidden="true">⚠</span>
              <h2>We couldn't complete the analysis.</h2>
              <p>{errorMsg || 'An unexpected error occurred. Please try again.'}</p>
              <button className="btn btn-primary" onClick={handleReset}>Try again</button>
            </div>
          </div>
        )}
      </main>

      {showInfoSections && <InfoSections />}
    </div>
  );
}
