import React from 'react';
import './VerificationInfo.css';

export default function VerificationInfo({ info }) {
  const isMissingInfo = 
    !info.company || info.company === 'Unknown' ||
    !info.website || info.website === 'Not provided' ||
    !info.officialEmail || info.officialEmail === 'Unknown';

  const rows = [
    { label: 'Organisation', value: info.company },
    { label: 'Official website', value: info.website },
    { label: 'Official email/domain', value: info.officialEmail },
    { label: 'Official social profiles', value: info.officialSocials },
  ];

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
