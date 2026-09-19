/**
 * Scamalyse API Client Service
 * Connects the React frontend with the FastAPI backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Sends opportunity details to the backend /api/v1/analyze endpoint.
 *
 * @param {Object} data Form input fields and optional screenshot.
 * @returns {Promise<Object>} The API response JSON.
 */
export async function analyzeOpportunity(data) {
  const formData = new FormData();

  // Primary required text
  const opportunityText = data.text || data.opportunity_text || '';
  if (!opportunityText.trim()) {
    throw new Error('Please provide the opportunity message or details to analyse.');
  }
  formData.append('opportunity_text', opportunityText.trim());

  // Optional contextual fields
  if (data.source) {
    formData.append('source_platform', data.source);
  }
  if (data.appliedFirst) {
    formData.append('user_applied', data.appliedFirst === 'yes');
  }
  if (data.senderContact) {
    formData.append('sender_email', data.senderContact);
  }
  if (data.salaryIncentive) {
    formData.append('salary_or_incentive', data.salaryIncentive);
  }
  if (data.unsureReason) {
    formData.append('user_concern', data.unsureReason);
  }
  if (data.screenshot instanceof File) {
    formData.append('screenshot', data.screenshot);
  }

  const endpoint = `${API_BASE_URL}/api/v1/analyze`;

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });
  } catch (netErr) {
    throw new Error(
      'Unable to connect to Scamalyse API server. Please ensure the backend is running on http://localhost:8000.'
    );
  }

  const responseJson = await response.json().catch(() => null);

  if (!response.ok) {
    if (responseJson?.error?.message) {
      throw new Error(responseJson.error.message);
    }
    if (response.status === 503) {
      throw new Error(
        'AI service is currently unavailable. Please verify your GEMINI_API_KEY in backend/.env.'
      );
    }
    throw new Error(
      `Analysis request failed (HTTP ${response.status}). Please try again.`
    );
  }

  return responseJson;
}

/**
 * Transforms backend API AnalysisResponse into the format expected by the React UI components.
 *
 * @param {Object} apiData Raw JSON response from FastAPI.
 * @param {Object} originalInput The original form input submitted by user.
 * @returns {Object} Transformed result object.
 */
export function transformBackendResponse(apiData, originalInput = {}) {
  const rawRisk = apiData.risk_indicator || {};
  const rawSummary = apiData.opportunity_summary || {};
  const rawFacts = apiData.extracted_facts || {};
  const rawVerif = apiData.verification_information || {};

  const riskScore = typeof rawRisk.score === 'number' ? rawRisk.score : 0;
  const riskLevel = (rawRisk.level || 'low').toLowerCase();

  const opportunitySummary = {
    company: rawSummary.company_claimed || 'Unknown',
    role: rawSummary.role || 'Unknown',
    category: rawSummary.opportunity_type || 'Internship / Job',
    salaryClaim: rawSummary.salary_claim && rawSummary.salary_claim !== 'UNKNOWN'
      ? rawSummary.salary_claim
      : (originalInput.salaryIncentive || 'Not specified'),
    source: originalInput.source || 'Submitted text',
  };

  const evidenceSignals = (apiData.triggered_risk_signals || []).map((sig, idx) => ({
    id: sig.rule_id || `sig-${idx + 1}`,
    title: sig.title,
    points: sig.points,
    severity: sig.severity,
    evidence: sig.evidence_quote ? `"${sig.evidence_quote}"` : 'Found in submitted offer details',
    explanation: sig.explanation,
  }));

  // Format payment request display
  let paymentDisplay = 'None mentioned';
  if (rawFacts.payment_requested === true) {
    paymentDisplay = rawFacts.payment_amount && rawFacts.payment_amount !== 'unknown'
      ? `Yes (${rawFacts.payment_amount})`
      : 'Yes — payment requested';
  } else if (rawFacts.payment_requested === 'unknown' || rawFacts.payment_requested == null) {
    paymentDisplay = 'Unknown / Not detected';
  }

  let selectionDisplay = 'Unknown';
  if (rawFacts.instant_selection === true) {
    selectionDisplay = 'Pre-selected / Instant offer (No interview)';
  } else if (rawFacts.interview_mentioned === true) {
    selectionDisplay = 'Standard interview mentioned';
  } else if (rawFacts.interview_mentioned === false) {
    selectionDisplay = 'No interview mentioned';
  }

  const extractedFacts = {
    company: opportunitySummary.company,
    role: opportunitySummary.role,
    opportunityType: opportunitySummary.category,
    salaryClaim: opportunitySummary.salaryClaim,
    paymentRequest: paymentDisplay,
    paymentMethod: rawFacts.payment_method || (rawFacts.payment_requested === true ? 'Unspecified' : 'N/A'),
    contactMethod: originalInput.source || 'Direct message',
    website: rawVerif.website || 'Not provided',
    selectionProcess: selectionDisplay,
  };

  const verificationInfo = {
    company: rawVerif.company || opportunitySummary.company,
    website: rawVerif.website || 'Not provided',
    officialEmail: rawVerif.email || 'Unknown',
    officialSocials: rawVerif.social_links && rawVerif.social_links.length > 0
      ? rawVerif.social_links.join(', ')
      : 'Not identified',
    externalResearch: null,
  };

  // Missing info clarification prompt
  let clarificationQuestion = null;
  if (apiData.missing_information?.fields?.length > 0) {
    const missingField = apiData.missing_information.fields[0];
    if (missingField === 'payment_requested') {
      clarificationQuestion = {
        context: "We could not determine whether any upfront payment, registration fee, or deposit was requested.",
        question: "Did this offer ask you to pay any registration, training, or deposit fee?",
        field: "payment_requested",
      };
    } else if (missingField === 'interview_mentioned') {
      clarificationQuestion = {
        context: "The selection process was not clearly mentioned in the provided text.",
        question: "Did you apply and undergo an interview or test before receiving this offer?",
        field: "interview_mentioned",
      };
    }
  }

  const safeSignals = (apiData.safe_signals || []).map((sig, idx) => ({
    id: sig.rule_id || `safe-${idx + 1}`,
    title: sig.title,
    points: sig.points || 10,
    confidence: sig.confidence || 'high',
    evidence: sig.evidence_quote ? `"${sig.evidence_quote}"` : null,
    explanation: sig.explanation,
  }));

  return {
    riskScore,
    riskLevel,
    category: opportunitySummary.category,
    opportunitySummary,
    evidenceSignals,
    safeSignals,
    extractedFacts,
    recommendedActions: apiData.recommended_actions || [
      'Independently verify the recruiter on LinkedIn and the company official careers page.',
      'Never pay any upfront fee for registration, task activation, or training.',
    ],
    verificationInfo,
    clarificationQuestion,
    analysisMetadata: apiData.analysis_metadata,
  };
}
