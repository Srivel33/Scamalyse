import React from 'react';
import './VerificationInfo.css';

export default function VerificationInfo({ info }) {
  const corpIntel = info.corporateVerification;
  const emailVerif = info.emailVerification;
  const webIntel = info.websiteInspection;

  const isMissingInfo = 
    !info.company || info.company === 'Unknown' ||
    !info.website || info.website === 'Not provided' ||
    !info.officialEmail || info.officialEmail === 'Unknown';

  const rows = [
    { label: 'Organisation', value: info.company },
    ...(corpIntel?.cin ? [{ label: 'Corporate CIN / Reg ID', value: corpIntel.cin }] : []),
    ...(corpIntel?.entity_type ? [{ label: 'Entity classification', value: corpIntel.entity_type }] : []),
    { label: 'Official website', value: info.website },
    { label: 'Official email/domain', value: info.officialEmail },
    { label: 'Official social profiles', value: info.officialSocials },
  ];

  function renderCorporateStatusBadge(status) {
    switch (status) {
      case 'ACTIVE':
        return {
          label: 'MCA Registered Corporate',
          type: 'safe',
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ),
        };
      case 'VERIFIED_STARTUP':
        return {
          label: 'Verified Tech Startup Ecosystem',
          type: 'startup',
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          ),
        };
      case 'STRUCK_OFF':
        return {
          label: 'Dissolved / Struck Off Entity',
          type: 'danger',
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          ),
        };
      case 'BRAND_IMPERSONATION':
        return {
          label: 'Brand Impersonation / Spoofed Identity',
          type: 'danger',
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ),
        };
      case 'UNREGISTERED':
      default:
        return {
          label: 'Unregistered / Ghost Entity',
          type: 'warning',
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          ),
        };
    }
  }

  function renderEmailStatusBadge(status) {
    switch (status) {
      case 'VERIFIED_CORPORATE':
        return {
          label: 'Verified Corporate Domain',
          type: 'safe',
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ),
        };
      case 'BRAND_IMPERSONATION':
        return {
          label: 'Brand Impersonation / Lookalike',
          type: 'danger',
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ),
        };
      case 'DISPOSABLE':
        return {
          label: 'Disposable / Burner Mailbox',
          type: 'danger',
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          ),
        };
      case 'INVALID_MX':
        return {
          label: 'Missing / Invalid Mail Server (No MX)',
          type: 'danger',
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          ),
        };
      case 'FREE_WEBMAIL':
        return {
          label: 'Public Free Webmail',
          type: 'warning',
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          ),
        };
      default:
        return {
          label: 'Domain Evaluated',
          type: 'neutral',
          icon: null,
        };
    }
  }

  function renderWebsiteStatusBadge(status) {
    switch (status) {
      case 'SAFE_ESTABLISHED':
        return {
          label: 'Established Domain (1+ Years)',
          type: 'safe',
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ),
        };
      case 'STARTUP_DOMAIN':
        return {
          label: 'Early-Stage Startup Domain',
          type: 'startup',
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          ),
        };
      case 'BRAND_IMPERSONATION':
        return {
          label: 'Phishing / Lookalike Domain',
          type: 'danger',
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ),
        };
      case 'NEW_DOMAIN_WARNING':
        return {
          label: 'Recently Created Domain (<60d)',
          type: 'warning',
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          ),
        };
      case 'SUSPICIOUS_HOSTING':
        return {
          label: 'Free Hosting / High-Abuse TLD',
          type: 'warning',
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          ),
        };
      default:
        return {
          label: 'Active Custom Domain',
          type: 'neutral',
          icon: null,
        };
    }
  }

  const corpBadge = corpIntel ? renderCorporateStatusBadge(corpIntel.status) : null;
  const emailBadge = emailVerif ? renderEmailStatusBadge(emailVerif.status) : null;
  const webBadge = webIntel ? renderWebsiteStatusBadge(webIntel.status) : null;

  return (
    <div className="verification-section">
      <div className="result-section-header">
        <h2 className="result-section-title">Verification information</h2>
        <p className="result-section-sub">
          Independent verification is recommended before you proceed.
        </p>
      </div>

      <div className="summary-grid verification-grid">
        {rows.map(({ label, value }) => {
          const isNeutral = !value || value === 'Unknown' || value === 'Not provided' || value === 'Not identified';
          return (
            <div key={label} className="summary-item">
              <span className="summary-key">{label}</span>
              <span className={`summary-value ${isNeutral ? 'value-neutral' : ''}`}>
                {value || 'Not identified'}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Corporate & Startup Multi-Platform OSINT Intelligence Card ── */}
      {corpIntel && (
        <div className={`email-intel-card intel-${corpBadge.type}`}>
          <div className="email-intel-header">
            <div className="email-intel-title-group">
              <span className="intel-card-eyebrow">CORPORATE & STARTUP OSINT MULTI-PLATFORM VERIFICATION</span>
              <h3 className="email-intel-domain">{corpIntel.company_name || info.company}</h3>
            </div>
            <span className={`intel-status-pill pill-${corpBadge.type}`}>
              {corpBadge.icon}
              <span>{corpBadge.label}</span>
            </span>
          </div>

          {/* Detected Platforms Chips */}
          {corpIntel.platforms_detected && corpIntel.platforms_detected.length > 0 && (
            <div className="intel-platforms-group">
              <span className="intel-platforms-label">Platforms & Ecosystems Detected:</span>
              <div className="intel-platforms-list">
                {corpIntel.platforms_detected.map((plat, idx) => (
                  <span key={idx} className="intel-platform-chip">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {plat}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="email-intel-details">{corpIntel.details}</p>

          <div className="email-intel-meta-grid">
            <div className="intel-meta-item">
              <span className="intel-meta-label">CIN / Registry ID</span>
              <span className="intel-meta-val font-mono">
                {corpIntel.cin || (corpIntel.status === 'VERIFIED_STARTUP' ? 'Pre-incorporation / Early-stage' : 'Not Registered')}
              </span>
            </div>
            <div className="intel-meta-item">
              <span className="intel-meta-label">Dedicated Own Website</span>
              <span className="intel-meta-val">
                {corpIntel.has_own_website && corpIntel.website_url ? (
                  <a
                    href={corpIntel.website_url.startsWith('http') ? corpIntel.website_url : `https://${corpIntel.website_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="intel-link-active"
                    title={`Visit official site: ${corpIntel.website_url}`}
                  >
                    <span>{corpIntel.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                ) : (
                  <span className="text-danger">No Dedicated Domain Identified</span>
                )}
              </span>
            </div>
            <div className="intel-meta-item">
              <span className="intel-meta-label">Registry Platform Status</span>
              <span className={`intel-meta-val ${corpIntel.status === 'ACTIVE' || corpIntel.status === 'VERIFIED_STARTUP' ? 'text-safe' : (corpIntel.status === 'STRUCK_OFF' ? 'text-danger' : '')}`}>
                {corpIntel.mca_status || (corpIntel.status === 'VERIFIED_STARTUP' ? 'Active Tech Startup' : (corpIntel.status === 'STRUCK_OFF' ? 'Struck Off / Dissolved' : 'Unregistered'))}
              </span>
            </div>
          </div>

          {/* Guidance Note */}
          <div className="intel-guidance-note">
            {corpIntel.status === 'STRUCK_OFF' ? (
              <p>
                <strong>High Threat Advisory:</strong> This entity is flagged as officially struck off, dissolved, or fraudulent in corporate registries. Never submit fees, identity proofs, or bank details.
              </p>
            ) : corpIntel.status === 'VERIFIED_STARTUP' ? (
              <p>
                <strong>Startup Ecosystem Protection:</strong> Verified early-stage tech startup footprint found. Real startups assess skills and never charge for recruitment or equipment.
              </p>
            ) : corpIntel.status === 'ACTIVE' ? (
              <p>
                <strong>Corporate Registry Advisory:</strong> Verified registered company. Ensure recruiter emails from the official corporate domain, not free webmail.
              </p>
            ) : (
              <p>
                <strong>Verification Tip:</strong> Entity not found in primary registries. If a new local venture, request their MSME Udyam certificate or verified founder profile.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Website & Application Link Threat Intelligence Card ── */}
      {webIntel && (
        <div className={`email-intel-card intel-${webBadge.type}`}>
          <div className="email-intel-header">
            <div className="email-intel-title-group">
              <span className="intel-card-eyebrow">WEBSITE & DOMAIN OSINT INTELLIGENCE</span>
              <h3 className="email-intel-domain">{webIntel.domain}</h3>
            </div>
            <span className={`intel-status-pill pill-${webBadge.type}`}>
              {webBadge.icon}
              <span>{webBadge.label}</span>
            </span>
          </div>

          <p className="email-intel-details">{webIntel.details}</p>

          <div className="email-intel-meta-grid">
            <div className="intel-meta-item">
              <span className="intel-meta-label">Domain Age</span>
              <span className="intel-meta-val">
                {webIntel.domain_age_days != null
                  ? (webIntel.domain_age_days >= 365 
                      ? `${(webIntel.domain_age_days / 365).toFixed(1)} years (${webIntel.domain_age_days} days)`
                      : `${webIntel.domain_age_days} days old`)
                  : 'Undisclosed / Hidden WHOIS'}
              </span>
            </div>
            <div className="intel-meta-item">
              <span className="intel-meta-label">Registration Date</span>
              <span className="intel-meta-val font-mono">{webIntel.creation_date || 'Protected / Redacted'}</span>
            </div>
            <div className="intel-meta-item">
              <span className="intel-meta-label">Accredited Registrar</span>
              <span className="intel-meta-val">{webIntel.registrar || 'Private Registration'}</span>
            </div>
          </div>

          {/* Startup vs MNC guidance */}
          <div className="intel-guidance-note">
            {webIntel.status === 'BRAND_IMPERSONATION' ? (
              <p>
                <strong>Enterprise Advisory:</strong> Established multinational corporations (e.g. Google, Microsoft, TCS, Infosys) exclusively recruit through their primary corporate domains. Unofficial lookalike portals or subdomains are almost always designed for phishing.
              </p>
            ) : webIntel.status === 'STARTUP_DOMAIN' ? (
              <p>
                <strong>Early-Stage Startup Protection:</strong> Legitimate emerging startups frequently operate on recently registered domains or developer hosting tiers. A recent domain does <em>not</em> mean scam—the golden rule is: <strong>genuine employers never ask for registration or equipment fees</strong>.
              </p>
            ) : (
              <p>
                <strong>Safety Tip:</strong> Before submitting personal resumes, check if the website has a working 'About Us' page and verified social or business registry presence.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Sender Email & Domain Threat Intelligence Card ── */}
      {emailVerif && (
        <div className={`email-intel-card intel-${emailBadge.type}`}>
          <div className="email-intel-header">
            <div className="email-intel-title-group">
              <span className="intel-card-eyebrow">RECRUITER EMAIL & MX INTELLIGENCE</span>
              <h3 className="email-intel-domain">{emailVerif.email}</h3>
            </div>
            <span className={`intel-status-pill pill-${emailBadge.type}`}>
              {emailBadge.icon}
              <span>{emailBadge.label}</span>
            </span>
          </div>

          <p className="email-intel-details">{emailVerif.details}</p>

          <div className="email-intel-meta-grid">
            <div className="intel-meta-item">
              <span className="intel-meta-label">Domain Name</span>
              <span className="intel-meta-val font-mono">{emailVerif.domain}</span>
            </div>
            <div className="intel-meta-item">
              <span className="intel-meta-label">DNS Mail Server (MX)</span>
              <span className={`intel-meta-val ${emailVerif.has_mx_records ? 'text-safe' : 'text-danger'}`}>
                {emailVerif.has_mx_records ? 'Active & Deliverable' : 'No Valid MX Records'}
              </span>
            </div>
            <div className="intel-meta-item">
              <span className="intel-meta-label">Mailbox Category</span>
              <span className="intel-meta-val">
                {emailVerif.is_disposable ? 'Temporary / Throwaway' : (emailVerif.is_free_webmail ? 'Public Consumer Webmail' : 'Custom Corporate Domain')}
              </span>
            </div>
          </div>

          {/* Startup vs MNC guidance */}
          <div className="intel-guidance-note">
            {emailVerif.status === 'BRAND_IMPERSONATION' ? (
              <p>
                <strong>Enterprise Advisory:</strong> Established multinational corporations (e.g. Google, Microsoft, TCS, Infosys) exclusively recruit through their verified corporate email domains and official career portals. Unofficial domains or free Gmail accounts claiming to represent them are almost always deceptive.
              </p>
            ) : (
              <p>
                <strong>Early-Stage Startup Advisory:</strong> Legitimate early-stage startups often use newly registered web domains or workspace emails. A new or basic domain is not a scam by itself—what matters is that they <em>never charge upfront application, equipment, or training fees</em>.
              </p>
            )}
          </div>
        </div>
      )}

      {info.externalResearch && (
        <div className="verification-external">
          <span className="summary-key">External research</span>
          <p className="summary-value">{info.externalResearch}</p>
        </div>
      )}

      {isMissingInfo ? (
        <div className="verification-disclaimer">
          No official identity or contact information was identified in the submitted content. This does not by itself indicate fraud. Verify the organisation independently before proceeding.
        </div>
      ) : (
        <div className="verification-disclaimer">
          An online presence does not prove legitimacy. Always verify through official government or independent registries.
        </div>
      )}
    </div>
  );
}
