import React, { useState, useRef, useEffect } from 'react';
import { extractTextFromImage } from '../services/api';
import './AnalyseForm.css';

export default function AnalyseForm({ onSubmit }) {
  const [text, setText] = useState('');
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [senderEmail, setSenderEmail] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractSuccess, setExtractSuccess] = useState('');
  const textareaRef = useRef(null);

  // Clean up object URL when unmounting or changing file
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleTextChange(val) {
    setText(val);
    if (validationError) setValidationError('');
  }

  function handleFileSelection(file) {
    if (!file) return;
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      setValidationError('Please upload a PNG, JPG, WEBP, or PDF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setValidationError('Screenshot file size exceeds the 5MB limit.');
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const newPreview = URL.createObjectURL(file);
    setScreenshotFile(file);
    setPreviewUrl(newPreview);
    setValidationError('');
    setExtractSuccess('');
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelection(file);
  }

  function handleFileInput(e) {
    const file = e.target.files?.[0];
    if (file) handleFileSelection(file);
  }

  function handleRemoveFile() {
    setScreenshotFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setExtractSuccess('');
  }

  async function handleExtractText() {
    if (!screenshotFile) return;
    setIsExtracting(true);
    setValidationError('');
    setExtractSuccess('');

    try {
      const extracted = await extractTextFromImage(screenshotFile);
      if (extracted && extracted.trim()) {
        setText((prev) => {
          if (!prev.trim()) return extracted.trim();
          return `${prev.trim()}\n\n--- Extracted from screenshot ---\n${extracted.trim()}`;
        });
        setExtractSuccess('Text extracted from screenshot! You can review or edit it below.');
      } else {
        setValidationError('No readable text could be detected in the uploaded screenshot.');
      }
    } catch (err) {
      setValidationError(err.message || 'Failed to extract text from the screenshot.');
    } finally {
      setIsExtracting(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() && !screenshotFile) {
      setValidationError('Please paste the opportunity message or upload an image to analyse.');
      textareaRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setValidationError('');
    setTimeout(() => {
      onSubmit({
        text,
        screenshot: screenshotFile,
        senderContact: senderEmail.trim() || undefined,
      });
    }, 300);
  }

  function formatFileSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <section id="analyse" className="analyse-section">

      {/* ══════════════════════════════════════
          PREMIUM HERO PANEL
      ══════════════════════════════════════ */}
      <div className="hero-panel">
        {/* Animated background grid */}
        <div className="hero-grid-bg" aria-hidden="true">
          <div className="hero-grid-lines" />
          <div className="hero-radial-glow" />
        </div>

        {/* Floating scam bubbles — decorative */}
        <div className="scam-bubbles" aria-hidden="true">
          <div className="scam-bubble scam-bubble-1">
            <span className="bubble-icon">⚠️</span>
            <div className="bubble-text">
              <strong>Earn ₹5000/day</strong>
              <span>No interview needed</span>
            </div>
          </div>
          <div className="scam-bubble scam-bubble-2">
            <span className="bubble-icon">🚨</span>
            <div className="bubble-text">
              <strong>Pay ₹999 training fee</strong>
              <span>Amazon WFH Job</span>
            </div>
          </div>
          <div className="scam-bubble scam-bubble-3">
            <span className="bubble-icon">⚠️</span>
            <div className="bubble-text">
              <strong>Telegram @amazon_hr</strong>
              <span>WhatsApp job offer</span>
            </div>
          </div>
        </div>

        {/* Hero text */}
        <div className="hero-content animate-fade-in stagger-children">
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-dot" />
            SCAM DETECTION FOR STUDENTS & JOB SEEKERS
          </div>

          <h1 className="hero-heading">
            Got a job offer?
            <br />
            <span className="hero-heading-accent">Check it before you respond.</span>
          </h1>

          <p className="hero-sub">
            Fake internships, task scams, and phishing emails look real. Scamalyse reads the message, checks the domain, verifies the company — and shows you exactly what's suspicious, with evidence.
          </p>

          {/* Trust Stats */}
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="stat-num">20+</span>
              <span className="stat-label">Scam patterns detected</span>
            </div>
            <div className="stat-divider" aria-hidden="true" />
            <div className="hero-stat">
              <span className="stat-num">5</span>
              <span className="stat-label">Verification layers</span>
            </div>
            <div className="stat-divider" aria-hidden="true" />
            <div className="hero-stat">
              <span className="stat-num">AI</span>
              <span className="stat-label">Evidence-backed results</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Workspace card (floats below hero) ── */}
      <div className="workspace-area animate-fade-in" style={{ animationDelay: '0.15s' }}>
        <div className="workspace-card">
          <div className="workspace-header">
            <h2 className="workspace-title">Check your opportunity</h2>
            <p className="workspace-subtitle">
              Paste the message you received — WhatsApp, email, LinkedIn, or Telegram. Scamalyse scans it, runs domain & company checks, and breaks down every warning signal with quoted evidence.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* ── Input Option A: Paste Text ── */}
            <div className="workspace-input-section">
              <div className="input-section-header">
                <label className="input-section-label" htmlFor="opportunity-text">
                  Paste the message
                </label>
                <span className="input-section-hint">WhatsApp, email, Telegram, LinkedIn DM, job description — any format works</span>
              </div>

              <div className={`textarea-wrap ${validationError && !screenshotFile && !text.trim() ? 'is-invalid' : ''}`}>
                <textarea
                  id="opportunity-text"
                  ref={textareaRef}
                  className="main-textarea"
                  rows={6}
                  placeholder="e.g. &#34;Hi, I'm HR from Amazon. We have a part-time job for you. Earn ₹5000/day by reviewing products. No interview required. Contact us on Telegram @amazon_hr&#34;"
                  value={text}
                  onChange={(e) => handleTextChange(e.target.value)}
                  aria-describedby={validationError ? 'text-error' : undefined}
                />
              </div>

              {extractSuccess && (
                <div className="extract-success-banner" role="status">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <span>{extractSuccess}</span>
                </div>
              )}
            </div>

            {/* ── Visual Divider: OR ── */}
            <div className="input-divider" aria-hidden="true">
              <span className="divider-line" />
              <span className="divider-badge">OR</span>
              <span className="divider-line" />
            </div>

            {/* ── Input Option B: Upload Document ── */}
            <div className="screenshot-section">
              <div className="screenshot-header">
                <h3 className="screenshot-title">Upload a screenshot or PDF</h3>
                <p className="screenshot-sub">
                  Got a screenshot of the offer? Upload it. Scamalyse uses AI to extract the text and run the full analysis — no copy-pasting needed.
                </p>
              </div>

              <div
                className={`upload-zone ${dragOver ? 'drag-over' : ''} ${screenshotFile ? 'has-file' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                role="region"
                aria-label="File upload area"
              >
                <input
                  id="screenshot-upload"
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp, application/pdf"
                  className="sr-only"
                  onChange={handleFileInput}
                />

                {screenshotFile ? (
                  <div className="upload-preview-card">
                    {screenshotFile.type === 'application/pdf' ? (
                      <div className="preview-thumb-wrap pdf-icon-wrap" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-color)', border: '1px solid var(--border-subtle)', borderRadius: '4px'}}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--text-secondary)'}}>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                      </div>
                    ) : (
                      previewUrl && (
                        <div className="preview-thumb-wrap">
                          <img src={previewUrl} alt="Screenshot preview" className="preview-thumb-img" />
                        </div>
                      )
                    )}
                    <div className="preview-meta">
                      <span className="preview-filename">{screenshotFile.name}</span>
                      <span className="preview-filesize">{formatFileSize(screenshotFile.size)}</span>
                      
                      <div className="preview-actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm btn-extract"
                          onClick={handleExtractText}
                          disabled={isExtracting}
                        >
                          {isExtracting ? (
                            <>
                              <span className="btn-spinner" aria-hidden="true" />
                              Extracting text...
                            </>
                          ) : (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                              </svg>
                              Extract text to editor
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          className="upload-remove btn-ghost-subtle"
                          onClick={handleRemoveFile}
                          aria-label="Remove screenshot"
                        >
                          Remove image
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="upload-empty">
                    <label htmlFor="screenshot-upload" className="btn btn-secondary btn-sm upload-btn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      Choose image or drop here
                    </label>
                    <span className="upload-hint">PNG, JPG, or WEBP up to 5MB</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Input Option C: Optional Sender & Link Threat Intelligence ── */}
            <div className="optional-intel-section">
              <div className="optional-intel-header">
                <div className="optional-header-title-row">
                  <span className="optional-intel-title">
                    Recruiter verification
                  </span>
                  <span className="optional-tag">Optional</span>
                </div>
                <p className="optional-intel-desc">
                  Got the sender's email? Add it here — we'll check if the domain is real, if mail servers exist, and if it's impersonating a known brand like Google or TCS.
                </p>
              </div>

              <div className="optional-intel-grid">
                {/* Email Field */}
                <div className="intel-field-group">
                  <label className="intel-field-label" htmlFor="sender-email-input">
                    Recruiter email address
                  </label>
                  <div className="email-input-field-wrap">
                    <div className="email-icon-adornment" aria-hidden="true">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2"/>
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                      </svg>
                    </div>
                    <input
                      id="sender-email-input"
                      type="email"
                      className="sender-email-field"
                      placeholder="e.g. hr@company.com or recruiter@gmail.com"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      autoComplete="off"
                      spellCheck="false"
                    />
                    {senderEmail && (
                      <button
                        type="button"
                        className="email-clear-btn"
                        onClick={() => setSenderEmail('')}
                        aria-label="Clear email"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* ── Validation Error ── */}
            {validationError && (
              <p id="text-error" className="validation-msg" role="alert">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {validationError}
              </p>
            )}

            {/* ── Privacy ── */}
            <div className="privacy-bar" role="note">
              <div className="privacy-icon-wrap">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div className="privacy-text">
                Only paste the offer message itself. Don't include passwords, OTPs, or banking details — those are never needed for scam detection.
              </div>
            </div>

            {/* ── Submit Action ── */}
            <div className="form-actions">
              <button 
                id="analyse-btn" 
                type="submit" 
                className={`btn btn-primary btn-lg ${isSubmitting ? 'is-loading' : ''}`}
                disabled={isSubmitting || isExtracting}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="btn-spinner" aria-hidden="true" />
                    {screenshotFile && !text.trim() ? 'Extracting & analysing screenshot...' : 'Analysing opportunity...'}
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
          <h3 className="wyg-title">What you get back</h3>
          <div className="wyg-grid">
            <div className="wyg-item">
              <h4>01</h4>
              <h5>A clear Risk Score</h5>
              <p>A 0–100 score with a label (Low / Moderate / High / Very High) and a plain-English verdict.</p>
            </div>
            <div className="wyg-item">
              <h4>02</h4>
              <h5>Evidence-Backed Warnings</h5>
              <p>Every flagged issue quotes the exact line from your message that triggered it — not vague AI guesses.</p>
            </div>
            <div className="wyg-item">
              <h4>03</h4>
              <h5>What to Do Next</h5>
              <p>Specific steps to verify the company, check the domain, or report the scam — tailored to what was found.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
