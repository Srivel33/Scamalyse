# ScamLens API Contract Specification

## 1. Overview
This document defines the exact contract between the React frontend and the FastAPI backend for the ScamLens MVP.

---

## 2. Processing Pipeline
The API enforces the following conceptual flow for analysis:
1. **Request** → Client sends unstructured text and optional screenshot.
2. **Validation** → Input is checked for length, type, and required fields.
3. **Privacy redaction** → Sensitive PII (emails, phones) is stripped from raw text.
4. **Gemini structured extraction** → LLM extracts factual claims using the strict JSON schema.
5. **Gemini response validation** → Backend verifies LLM output against the schema.
6. **Deterministic risk engine** → Extracted facts are evaluated against the 11 risk rules.
7. **Evidence generation** → Matched rules are bundled with exact quote evidence.
8. **Recommended actions** → Contextual actions are generated based on triggered rules.
9. **Response** → Final JSON payload is returned to the frontend.

*(Note: Gemini does NOT calculate the final risk score or verdict).*

---

## 3. Primary Endpoint: `POST /api/v1/analyze`

**Purpose:** Submit an opportunity message for deterministic risk analysis.

### Request Format
Content-Type: `multipart/form-data` (required to support optional screenshots). Base64 encoding for screenshots is prohibited to avoid massive JSON payloads and memory bloat.

| Field | Type | Required? | Description |
| :--- | :--- | :--- | :--- |
| `opportunity_text` | string | **Yes** | The core message or description pasted by the user. |
| `source_platform` | string | Optional | e.g., "WhatsApp", "LinkedIn". |
| `user_applied` | boolean | Optional | Whether the user already applied. |
| `sender_email` | string | Optional | Extracted sender email if known. |
| `sender_website` | string | Optional | Extracted sender domain if known. |
| `salary_or_incentive` | string | Optional | Explicit compensation context. |
| `user_concern` | string | Optional | Specific worry the user has. |
| `screenshot` | file (binary) | Optional | PNG/JPG evidence of the offer. |

### Validation Rules
* `opportunity_text`: Must be between 10 and 5000 characters.
* `screenshot`: Must be `< 5MB` and strictly `image/png` or `image/jpeg`.

---

### Response Format
Content-Type: `application/json`

```json
{
  "analysis_metadata": {
    "analysis_id": "uuid",
    "timestamp": "2026-08-23T10:00:00Z",
    "processing_time_ms": 1250
  },
  "risk_indicator": {
    "score": 50,
    "level": "HIGH",
    "evidence_coverage": "high"
  },
  "opportunity_summary": {
    "company_claimed": "DataSys",
    "opportunity_type": "internship"
  },
  "extracted_facts": {
    "payment_requested": true,
    "payment_amount": "₹999",
    "instant_selection": true
  },
  "triggered_risk_signals": [
    {
      "rule_id": "R01",
      "title": "Upfront employment/activation/registration fee",
      "points": 35,
      "severity": "HIGH",
      "evidence_quote": "pay a refundable ₹999 onboarding fee",
      "explanation": "Legitimate employers do not charge candidates to work for them."
    }
  ],
  "recommended_actions": [
    "Do not pay any upfront fees.",
    "Verify the company independently."
  ],
  "verification_information": {
    "domain_verification_available": false
  },
  "missing_information": {
    "fields": ["interview_mentioned"],
    "prompt": "We could not determine if an interview process exists. Did you speak with anyone?"
  },
  "disclaimer": "Evidence-based risk indicator — not proof of fraud."
}
```

---

## 4. Missing Information Handling
The API represents undetermined information exactly as requested by the Gemini schema: using `null` or `"UNKNOWN"`. 
It does **not** invent values. 
The `missing_information` array helps the frontend understand what data (e.g., `interview_mentioned = UNKNOWN`) could improve the analysis if the user provided it later. *Conversational follow-up is not implemented in the MVP.*

---

## 5. Error Format
The API enforces a strict, consistent error structure.

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "The opportunity text must be at least 10 characters long.",
    "details": null
  }
}
```

**Standard Error Codes:**
* `INVALID_INPUT`: Missing required text or field validation failed.
* `FILE_TOO_LARGE`: Screenshot exceeds 5MB.
* `UNSUPPORTED_FILE`: Screenshot is not PNG/JPG.
* `AI_UNAVAILABLE`: Upstream LLM provider timed out.
* `AI_INVALID_RESPONSE`: LLM failed to output the required strict JSON schema.
* `ANALYSIS_FAILED`: Risk engine crashed during evaluation.
* `INTERNAL_ERROR`: Unhandled backend exception.

---

## 6. Health Endpoint: `GET /api/v1/health`

**Purpose:** Check backend availability.
**Request:** None.
**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2026-08-23T10:00:00Z"
}
```

---

## 7. Future Feedback Endpoint: `POST /api/v1/feedback`
*(Do NOT implement for MVP)*

**Purpose:** Allow users to submit optional, unverified community feedback on an analysed opportunity.
**Expected Fields:** `analysis_id`, `feedback_type` (e.g., confirmed_suspicious), `reason`.
**Safety Rule:** Feedback remains strictly isolated. It does NOT automatically change the live risk score or retrain models.

---

## 8. External Verification
External verification (e.g., querying a corporate registry or domain WHOIS) is intentionally **excluded** from the core analysis contract. 
*   **Company existence verification:** Proves a company is legally registered.
*   **Offer authenticity verification:** Proves the *specific message* actually came from that company.

ScamLens focuses on the latter via pattern analysis. External verification will be built as a separate, future service layer.

---

## 9. Security & Privacy Rules
*   **No Frontend Secrets:** The Gemini API key remains strictly server-side.
*   **Input Validation:** Strict multipart parsing and image validation (magic bytes check, size limits).
*   **Data Minimization:** No raw messages or images are persisted to a database by default.
*   **Log Sanitization:** Raw text containing potential PII must NOT be logged in backend application logs.

---

## 10. Examples

### Example 1: Successful Request (Multipart)
```http
POST /api/v1/analyze HTTP/1.1
Content-Type: multipart/form-data; boundary=---Boundary123

-----Boundary123
Content-Disposition: form-data; name="opportunity_text"

I was offered a job at Amazon but I have to pay 500rs registration fee.
-----Boundary123--
```

### Example 2: Successful Response
```json
{
  "analysis_metadata": { "analysis_id": "abc-123" },
  "risk_indicator": {
    "score": 35,
    "level": "MODERATE",
    "evidence_coverage": "high"
  },
  "opportunity_summary": { "company_claimed": "Amazon" },
  "extracted_facts": { "payment_requested": true },
  "triggered_risk_signals": [
    {
      "rule_id": "R01",
      "title": "Upfront registration fee",
      "points": 35,
      "severity": "HIGH",
      "evidence_quote": "pay 500rs registration fee",
      "explanation": "Legitimate employers do not charge fees."
    }
  ],
  "recommended_actions": ["Do not pay the fee."],
  "missing_information": { "fields": [] },
  "disclaimer": "Evidence-based risk indicator — not proof of fraud."
}
```

### Example 3: Validation Error
```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "opportunity_text is required.",
    "details": null
  }
}
```

### Example 4: AI Failure
```json
{
  "error": {
    "code": "AI_UNAVAILABLE",
    "message": "The AI extraction service is temporarily unreachable.",
    "details": null
  }
}
```

### Example 5: Incomplete-Information Response
```json
{
  "analysis_metadata": { "analysis_id": "def-456" },
  "risk_indicator": {
    "score": 0,
    "level": "LOW",
    "evidence_coverage": "low"
  },
  "opportunity_summary": {},
  "extracted_facts": { "interview_mentioned": "UNKNOWN", "payment_requested": "UNKNOWN" },
  "triggered_risk_signals": [],
  "recommended_actions": ["Proceed with normal caution."],
  "missing_information": {
    "fields": ["payment_requested"],
    "prompt": "Were you asked to pay any money?"
  },
  "disclaimer": "Evidence-based risk indicator — not proof of fraud."
}
```

---

## 11. Frontend Contract Mapping
The React frontend will specifically consume:
*   `risk_indicator.score` (To drive the gauge UI)
*   `triggered_risk_signals` (To map over and display Evidence Cards with exact quotes)
*   `recommended_actions` (To display in the Next Steps section)
*   `error` (To transition to the Error state)
*   `disclaimer` (To display in the footer of the results page)

---

## 12. MVP Scope

*   **MUST HAVE NOW:** 
    *   `POST /api/v1/analyze` (Text only, multipart parsing enabled)
    *   `GET /api/v1/health`
    *   Strict error handling structure.
*   **SHOULD HAVE:**
    *   Screenshot image processing within `/analyze`.
*   **FUTURE:**
    *   `POST /api/v1/feedback`
    *   External Domain Verification.
