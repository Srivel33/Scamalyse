import React, { useEffect, useState } from 'react';
import './AnalysingState.css';

const STEPS = [
  { id: 0, label: 'Reading submitted information' },
  { id: 1, label: 'Extracting opportunity details' },
  { id: 2, label: 'Evaluating warning signals' },
  { id: 3, label: 'Preparing your assessment' },
];

export default function AnalysingState({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentStep >= STEPS.length) {
      const done = setTimeout(onComplete, 600);
      return () => clearTimeout(done);
    }
    const timer = setTimeout(() => {
      setCurrentStep((s) => s + 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [currentStep, onComplete]);

  return (
    <section className="analysing-section animate-fade-in">
      <div className="analysing-card">
        <h2 className="analysing-heading">Analysing your opportunity</h2>
        <p className="analysing-sub">
          We're reviewing the information you provided and identifying relevant warning signals.
        </p>

        <div className="progress-container">
          {STEPS.map((step, index) => {
            const isDone = currentStep > step.id;
            const isActive = currentStep === step.id;
            const isPending = currentStep < step.id;

            return (
              <div
                key={step.id}
                className={`progress-step ${isDone ? 'is-done' : ''} ${isActive ? 'is-active' : ''} ${isPending ? 'is-pending' : ''}`}
                aria-current={isActive ? 'step' : undefined}
              >
                <div className="progress-indicator">
                  <div className="progress-node">
                    {isDone ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <span className="step-num">0{index + 1}</span>
                    )}
                  </div>
                  {index < STEPS.length - 1 && <div className="progress-line" />}
                </div>
                <div className="progress-content">
                  <span className="progress-label">{step.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
