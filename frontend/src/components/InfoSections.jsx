import React from 'react';
import Logo from './Logo';
import './InfoSections.css';

const HOW_IT_WORKS = [
  { step: '01', title: 'Share the offer', desc: 'Paste the message, email, or describe what you received.' },
  { step: '02', title: 'Detect evidence', desc: 'Relevant facts and warning signals are identified.' },
  { step: '03', title: 'Verify before acting', desc: 'Get practical independent verification steps.' },
];

export default function InfoSections() {
  return (
    <>
      {/* ── How It Works (Dark Section) ── */}
      <section id="how-it-works" className="info-section info-section-dark">
        <div className="info-inner">
          <div className="info-header-centered">
            <h2 className="info-heading">From an opportunity message to clear next steps.</h2>
          </div>
          
          <div className="hiw-process">
            {HOW_IT_WORKS.map(({ step, title, desc }, index) => (
              <div key={step} className="hiw-step">
                <div className="hiw-step-header">
                  <span className="hiw-step-num">{step}</span>
                  {index < HOW_IT_WORKS.length - 1 && <div className="hiw-connector" />}
                </div>
                <h3 className="hiw-title">{title}</h3>
                <p className="hiw-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Purpose ── */}
      <section id="about" className="info-section info-section-subtle">
        <div className="info-inner">
          <div className="info-header-centered">
            <h2 className="info-heading">Built for students who don't want to guess.</h2>
            <p className="info-subheading">ScamLens supports your decision. It does not make the decision for you.</p>
          </div>
          
          <div className="purpose-grid">
            <div className="purpose-item">
              <div className="purpose-icon">1</div>
              <h4>Evidence over assumptions</h4>
              <p>Every warning is tied directly to supporting evidence found in the opportunity.</p>
            </div>
            <div className="purpose-item">
              <div className="purpose-icon">2</div>
              <h4>Risk is an indicator</h4>
              <p>A higher score means more warning signals, not that fraud is mathematically proven.</p>
            </div>
            <div className="purpose-item">
              <div className="purpose-icon">3</div>
              <h4>Verify independently</h4>
              <p>We provide the next steps you need to confirm important claims through official channels.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Privacy ── */}
      <section id="privacy" className="info-section info-section-light">
        <div className="info-inner">
          <div className="info-header-centered">
            <h2 className="info-heading">Privacy is part of the product.</h2>
            <p className="info-subheading">Opportunity messages can contain personal information. ScamLens is designed to minimise processing.</p>
          </div>

          <div className="privacy-visual-flow">
            <div className="pv-step">01 Your input</div>
            <div className="pv-divider"></div>
            <div className="pv-step pv-highlight">02 Sensitive information minimised</div>
            <div className="pv-divider"></div>
            <div className="pv-step">03 Relevant facts analysed</div>
            <div className="pv-divider"></div>
            <div className="pv-step">04 Risk explained</div>
          </div>

          <div className="privacy-grid">
            <div className="privacy-card">
              <h4>Don't submit sensitive credentials</h4>
              <p>Never submit passwords, OTPs, banking credentials, Aadhaar, PAN, or identity documents.</p>
            </div>
            <div className="privacy-card">
              <h4>Minimise what you share</h4>
              <p>Only provide information needed to understand and assess the opportunity.</p>
            </div>
            <div className="privacy-card">
              <h4>Raw offers are not retained by default</h4>
              <p>The application is designed not to permanently store submitted opportunity messages as part of the normal flow.</p>
            </div>
            <div className="privacy-card">
              <h4>Feedback stays contextual</h4>
              <p>Optional feedback is treated as unverified context and does not automatically change the risk indicator.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-left">
              <div className="footer-logo">
                <span className="footer-logo-mark"><Logo width={24} height={24} /></span>
                <span className="footer-brand">ScamLens</span>
              </div>
              <p className="footer-copy">
                Verify before you apply.<br />
                Evidence-based opportunity safety for students.
              </p>
            </div>
            <div className="footer-right">
              <div className="footer-links-col">
                <span className="footer-links-title">Product</span>
                <a href="#how-it-works">How it works</a>
                <a href="/">Analyse opportunity</a>
              </div>
              <div className="footer-links-col">
                <span className="footer-links-title">Company</span>
                <a href="#about">About</a>
                <a href="#privacy">Privacy</a>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p className="footer-legal">© 2026 ScamLens</p>
            <p className="footer-disclaimer">Decision support, not a guarantee of legitimacy or fraud.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
