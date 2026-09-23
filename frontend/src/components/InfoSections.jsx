import React, { useEffect, useRef } from 'react';
import Logo from './Logo';
import './InfoSections.css';

// Intersection observer hook for scroll animations
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('is-revealed'); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return ref;
}

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="14" y2="13"/>
      </svg>
    ),
    title: 'Paste what you received',
    desc: 'WhatsApp message, email, LinkedIn DM, Telegram text — any format. If you got a screenshot, upload that instead.',
    tag: 'Any platform',
  },
  {
    step: '02',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
      </svg>
    ),
    title: 'Multi-layer scan runs',
    desc: 'Scamalyse checks the language for scam patterns, looks up the domain\'s registration age, verifies the company name, and inspects the email\'s mail servers.',
    tag: 'Automated',
  },
  {
    step: '03',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <polyline points="9 12 11 14 15 10"/>
      </svg>
    ),
    title: 'Read the verdict with evidence',
    desc: 'You get a risk score with every warning signal quoting the exact text that triggered it — plus steps to independently verify.',
    tag: 'Transparent',
  },
];

const PURPOSE_ITEMS = [
  {
    num: '1',
    color: 'teal',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
        <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
      </svg>
    ),
    title: 'Every warning has a quote',
    desc: 'We don\'t just say "this looks suspicious." We show you the exact sentence that raised the flag — directly quoted from your message.',
  },
  {
    num: '2',
    color: 'amber',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
    title: 'Score = indicator, not verdict',
    desc: 'A high score means we found warning patterns. It doesn\'t legally prove fraud — but it tells you exactly what to look into before you respond.',
  },
  {
    num: '3',
    color: 'green',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'You make the final call',
    desc: 'Scamalyse gives you independent verification steps — official company portals, government registries, real contact channels. We support, you decide.',
  },
];

const PRIVACY_ITEMS = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    title: "Don't paste credentials",
    desc: 'Passwords, OTPs, bank account numbers, Aadhaar, PAN — scam detection never needs these. Only paste the scammer\'s message.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    title: 'Paste only what the scammer sent',
    desc: "Only include the actual message or offer. Your personal response or contact details aren't needed and aren't expected.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
        <path d="M10 11v6"/><path d="M14 11v6"/>
        <path d="M9 6V4h6v2"/>
      </svg>
    ),
    title: 'Offer text is not permanently stored',
    desc: 'Submitted messages are not stored as part of the normal analysis flow. Only anonymised signals and optional feedback may be retained.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    title: 'Feedback is always optional',
    desc: 'Confirming a scam helps improve detection accuracy for others. It\'s completely optional and never tied to your identity.',
  },
];

export default function InfoSections() {
  const howRef = useReveal();
  const purposeRef = useReveal();
  const privacyRef = useReveal();
  const footerRef = useReveal(0.05);

  return (
    <>
      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="info-section info-section-how">
        <div className="info-inner" ref={howRef}>
          <div className="reveal-block info-header-centered">
            <span className="section-eyebrow">How it works</span>
            <h2 className="info-heading">From suspicious message<br/>to clear answer — in seconds.</h2>
            <p className="info-subheading">Three things happen automatically the moment you hit Analyse.</p>
          </div>

          <div className="hiw-process reveal-block" style={{ transitionDelay: '0.1s' }}>
            {HOW_IT_WORKS.map(({ step, icon, title, desc, tag }, i) => (
              <div key={step} className="hiw-card" style={{ animationDelay: `${i * 0.12}s` }}>
                <div className="hiw-card-top">
                  <div className="hiw-icon-wrap">{icon}</div>
                  <span className="hiw-step-label">{step}</span>
                </div>
                <h3 className="hiw-title">{title}</h3>
                <p className="hiw-desc">{desc}</p>
                <span className="hiw-tag">{tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT / PURPOSE ── */}
      <section id="about" className="info-section info-section-purpose">
        <div className="info-inner" ref={purposeRef}>
          <div className="reveal-block info-header-centered">
            <span className="section-eyebrow">Why Scamalyse</span>
            <h2 className="info-heading">Built because fake offers<br/>are getting harder to spot.</h2>
            <p className="info-subheading">Scammers now use polished emails, real-looking company names, and official-sounding language. We check the things you can't see at a glance.</p>
          </div>

          <div className="purpose-grid reveal-block" style={{ transitionDelay: '0.15s' }}>
            {PURPOSE_ITEMS.map(({ num, color, icon, title, desc }) => (
              <div key={num} className={`purpose-card purpose-card-${color}`}>
                <div className="purpose-icon-wrap">{icon}</div>
                <h4 className="purpose-title">{title}</h4>
                <p className="purpose-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRIVACY ── */}
      <section id="privacy" className="info-section info-section-privacy">
        <div className="info-inner" ref={privacyRef}>
          <div className="reveal-block info-header-centered">
            <span className="section-eyebrow">Privacy</span>
            <h2 className="info-heading">Your message is scanned,<br/>not stored.</h2>
            <p className="info-subheading">Offer messages can contain personal details. Scamalyse is built to use only what it needs.</p>
          </div>

          <div className="privacy-pipeline reveal-block" style={{ transitionDelay: '0.1s' }}>
            {[
              { num: '01', title: 'Your message in', sub: 'Input received' },
              { num: '02', title: 'Personal info stripped', sub: 'PII redacted' },
              { num: '03', title: 'Facts extracted', sub: 'Rules evaluated' },
              { num: '04', title: 'Risk score out', sub: 'Report generated' },
            ].map(({ num, title, sub }, i) => (
              <React.Fragment key={num}>
                <div className="pipeline-node">
                  <span className="pipeline-num">{num}</span>
                  <span className="pipeline-label">{title}</span>
                  <span className="pipeline-sub">{sub}</span>
                </div>
                {i < 3 && (
                  <div className="pipeline-arrow" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="privacy-grid reveal-block" style={{ transitionDelay: '0.2s' }}>
            {PRIVACY_ITEMS.map(({ icon, title, desc }) => (
              <div className="privacy-card" key={title}>
                <div className="privacy-icon-wrap">{icon}</div>
                <h4 className="privacy-title">{title}</h4>
                <p className="privacy-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="site-footer" ref={footerRef}>
        <div className="footer-inner reveal-block">
          <div className="footer-top">
            <div className="footer-left">
              <div className="footer-logo">
                <span className="footer-logo-mark"><Logo width={22} height={22} /></span>
                <span className="footer-brand">Scamalyse</span>
              </div>
              <p className="footer-tagline">Verify before you apply.</p>
              <p className="footer-copy">Evidence-based scam detection for students and job seekers.</p>
            </div>
            <div className="footer-right">
              <div className="footer-links-col">
                <span className="footer-links-title">Product</span>
                <a href="#how-it-works">How it works</a>
                <a href="/">Check an opportunity</a>
              </div>
              <div className="footer-links-col">
                <span className="footer-links-title">Info</span>
                <a href="#about">About</a>
                <a href="#privacy">Privacy</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="footer-legal">© 2026 Scamalyse</p>
            <p className="footer-disclaimer">Decision support tool — not a guarantee of legitimacy or fraud.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
