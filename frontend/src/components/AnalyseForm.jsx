import React, { useState, useRef } from 'react';
import './AnalyseForm.css';

const SOURCE_OPTIONS = [
  'WhatsApp', 'Email', 'LinkedIn', 'Telegram', 'Instagram', 'Other',
];

const APPLIED_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'not-sure', label: 'Not sure' },
];

export default function AnalyseForm({ onSubmit }) {
  const [formState, setFormState] = useState({
    text: '',
    source: '',
    senderContact: '',
    appliedFirst: '',
    salaryIncentive: '',
    unsureReason: '',
  });
  const [dragOver, setDragOver] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [contextOpen, setContextOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef(null);

  function handleChange(field, value) {
    setFormState((prev) => ({ ...prev, [field]: value }));
    if (field === 'text' && validationError) setValidationError('');
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) setScreenshotFile(file);
  }

  function handleFileInput(e) {
    const file = e.target.files?.[0];
    if (file) setScreenshotFile(file);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!formState.text.trim()) {
      setValidationError('Add some opportunity details before analysing.');
      textareaRef.current?.focus();
      return;
    }
    
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit({ ...formState, screenshot: screenshotFile });
    }, 400);
  }

  const contextCount = [formState.source, formState.senderContact, formState.appliedFirst, formState.salaryIncentive, formState.unsureReason].filter(Boolean).length;

  return (
    <section className="analyse-section">
      {/* ── Hero ── */}
      <div className="hero-area">
        <div className="hero-content animate-fade-in stagger-children">
          <div className="hero-eyebrow">
            OPPORTUNITY SAFETY FOR STUDENTS
          </div>

          <h1 className="hero-heading">
            Before you apply,<br />
            <span className="hero-heading-accent">know what you're getting into.</span>
          </h1>

          <p className="hero-sub">
            Check internships, jobs, task offers, courses, and other opportunities for warning signals before you pay, apply, or share personal information.
          </p>
        </div>
      </div>

      {/* ── Workspace ── */}
      <div className="workspace-area animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="workspace-card">
          <div className="workspace-header">
            <h2 className="workspace-title">Analyse an opportunity</h2>
            <p className="workspace-subtitle">Paste any offer message, email, or job post below. Scamalyse extracts facts and explains scam signals with evidence.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* ── Textarea ── */}
            <div className="workspace-input-section">
              <label className="workspace-label sr-only" htmlFor="opportunity-text">
                Opportunity details
              </label>
              <div className={`textarea-wrap ${validationError ? 'is-invalid' : ''}`}>
                <textarea
                  id="opportunity-text"
                  ref={textareaRef}
                  className="main-textarea"
                  rows={6}
                  placeholder="Paste the message, email, job description, or offer details here..."
                  value={formState.text}
                  onChange={(e) => handleChange('text', e.target.value)}
                  aria-describedby={validationError ? 'text-error' : undefined}
                />
              </div>
              {validationError && (
                <p id="text-error" className="validation-msg" role="alert">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {validationError}
                </p>
              )}
            </div>

            {/* ── Context Toggle ── */}
            <button
              type="button"
              className="context-toggle"
              onClick={() => setContextOpen((v) => !v)}
              aria-expanded={contextOpen}
            >
              <div className="context-toggle-left">
                <span className="context-toggle-icon">{contextOpen ? '-' : '+'}</span>
                <div className="context-toggle-text">
                  <span className="context-toggle-label">Add context</span>
                  <span className="context-toggle-sub">Optional details can make the assessment more precise.</span>
                </div>
              </div>
              <div className="context-toggle-right">
                {contextCount > 0 && <span className="context-count">{contextCount}</span>}
              </div>
            </button>

            {/* ── Context Fields ── */}
            <div className={`context-panel-wrapper ${contextOpen ? 'is-open' : ''}`}>
              <div className="context-panel">
                <div className="context-grid">
                  <div className="field-group">
                    <label className="field-label" htmlFor="source-select">Source</label>
                    <p className="field-hint">Where did you receive this?</p>
                    <div className="select-wrapper">
                      <select id="source-select" className="field-select" value={formState.source} onChange={(e) => handleChange('source', e.target.value)}>
                        <option value="">Select source</option>
                        {SOURCE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="field-group">
                    <label className="field-label" htmlFor="sender-contact">Opportunity type</label>
                    <p className="field-hint">Internship / Job / Task / Course / Other</p>
                    <input id="sender-contact" type="text" className="field-input" placeholder="e.g. Internship" value={formState.senderContact} onChange={(e) => handleChange('senderContact', e.target.value)} />
                  </div>

                  <div className="field-group context-full">
                    <label className="field-label" htmlFor="unsure-reason">Additional context</label>
                    <p className="field-hint">Anything else that may help explain the offer.</p>
                    <input id="unsure-reason" type="text" className="field-input" placeholder="Optional context..." value={formState.unsureReason} onChange={(e) => handleChange('unsureReason', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Screenshot Section ── */}
            <div className="screenshot-section">
              <div className="screenshot-header">
                <h3 className="screenshot-title">Have a screenshot?</h3>
                <p className="screenshot-sub">Add a screenshot as supporting evidence.</p>
              </div>
              
              <div
                className={`upload-zone ${dragOver ? 'drag-over' : ''} ${screenshotFile ? 'has-file' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                role="region"
                aria-label="Screenshot upload area"
              >
                <input id="screenshot-upload" type="file" accept="image/png, image/jpeg" className="sr-only" onChange={handleFileInput} />
                
                {screenshotFile ? (
                  <div className="upload-selected">
                    <div className="upload-file-info">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      <span className="upload-filename">{screenshotFile.name}</span>
                    </div>
                    <button type="button" className="upload-remove btn-ghost-subtle" onClick={() => setScreenshotFile(null)} aria-label="Remove screenshot">Remove</button>
                  </div>
                ) : (
                  <div className="upload-empty">
                    <label htmlFor="screenshot-upload" className="btn btn-secondary btn-sm upload-btn">
                      Upload screenshot
                    </label>
                    <span className="upload-hint">PNG or JPG</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Privacy ── */}
            <div className="privacy-bar" role="note">
              <div className="privacy-icon-wrap">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <div className="privacy-text">
                Your message is analysed to identify risk signals. Avoid entering passwords, OTPs, bank details, or identity documents.
              </div>
            </div>

            {/* ── Actions ── */}
            <div className="form-actions">
              <button 
                id="analyse-btn" 
                type="submit" 
                className={`btn btn-primary btn-lg ${isSubmitting ? 'is-loading' : ''}`}
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="btn-spinner" aria-hidden="true" />
                    Analysing opportunity...
                  </>
                ) : (
                  'Analyse opportunity'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ── What You Will Receive ── */}
        <div className="what-you-get">
          <h3 className="wyg-title">What you'll receive</h3>
          <div className="wyg-grid">
            <div className="wyg-item">
              <h4>01</h4>
              <h5>Risk indicator</h5>
              <p>Understand the overall level of concern.</p>
            </div>
            <div className="wyg-item">
              <h4>02</h4>
              <h5>Evidence</h5>
              <p>See which details triggered warning signals.</p>
            </div>
            <div className="wyg-item">
              <h4>03</h4>
              <h5>Next steps</h5>
              <p>Know what to verify before you act.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
