import React, { useState, useCallback, useRef } from 'react';
import Header from './components/Header';
import AnalyseForm from './components/AnalyseForm';
import AnalysingState from './components/AnalysingState';
import ClarificationState from './components/ClarificationState';
import RiskAssessment from './components/RiskAssessment';
import InfoSections from './components/InfoSections';
import { HIGH_RISK_RESULT } from './data/mockData';
import { analyzeOpportunity, transformBackendResponse } from './services/api';
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
  const [isDemo, setIsDemo] = useState(false);
  const [currentFormData, setCurrentFormData] = useState(null);

  // Synchronization refs between API request and progress animation
  const apiResultRef = React.useRef(null);
  const apiErrorRef = React.useRef(null);
  const progressDoneRef = React.useRef(false);

  /** Central analysis runner connecting to backend */
  const runAnalysis = useCallback(async (formData) => {
    apiResultRef.current = null;
    apiErrorRef.current = null;
    progressDoneRef.current = false;
    setCurrentFormData(formData);
    setAppState('analysing');

    try {
      const responseData = await analyzeOpportunity(formData);
      const transformed = transformBackendResponse(responseData, formData);
      apiResultRef.current = transformed;

      // If progress animation has already finished, transition immediately
      if (progressDoneRef.current) {
        setResult(transformed);
        if (transformed.clarificationQuestion) {
          setAppState('clarification');
        } else {
          setAppState('result');
        }
      }
    } catch (err) {
      console.error('Scamalyse API Error:', err);
      apiErrorRef.current = err.message || 'An unexpected error occurred during analysis.';
      if (progressDoneRef.current) {
        setErrorMsg(apiErrorRef.current);
        setAppState('error');
      }
    }
  }, []);

  /** Called by AnalyseForm on real submission */
  const handleSubmit = useCallback((formData) => {
    setIsDemo(false);
    runAnalysis(formData);
  }, [runAnalysis]);

  /** Called by AnalysingState when all progress steps complete */
  const handleAnalysisComplete = useCallback(() => {
    progressDoneRef.current = true;

    // Check if error occurred during progress
    if (apiErrorRef.current) {
      setErrorMsg(apiErrorRef.current);
      setAppState('error');
      return;
    }

    // Check if API result is already ready
    if (apiResultRef.current) {
      const res = apiResultRef.current;
      setResult(res);
      if (!isDemo && res.clarificationQuestion) {
        setAppState('clarification');
      } else {
        setAppState('result');
      }
    }
    // Otherwise, the progress step completed but API is still computing (e.g. Gemini slow response);
    // AnalysingState stays up until runAnalysis resolves and sees progressDoneRef is true.
  }, [isDemo]);

  /** Called by ClarificationState when user answers or skips */
  const handleClarificationAnswer = useCallback((answer) => {
    if (!answer || !currentFormData) {
      // User skipped or answered "I don't know" -> display existing assessment
      setAppState('result');
      return;
    }

    // Append clarification to input details and re-evaluate
    const updatedForm = {
      ...currentFormData,
      text: `${currentFormData.text}\n\n[Clarification Details]: ${answer}`,
    };
    runAnalysis(updatedForm);
  }, [currentFormData, runAnalysis]);

  /** Reset to idle / new analysis */
  const handleReset = useCallback(() => {
    setAppState('idle');
    setResult(null);
    setErrorMsg('');
    setIsDemo(false);
    setCurrentFormData(null);
    apiResultRef.current = null;
    apiErrorRef.current = null;
    progressDoneRef.current = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ── Render ────────────────────────────────────────────────

  const showInfoSections = appState === 'idle';

  return (
    <div className="app-container">
      <Header showNavLinks={appState === 'idle'} />

      <main className="main-content app-main">
        {appState === 'idle' && (
          <AnalyseForm onSubmit={handleSubmit} />
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
