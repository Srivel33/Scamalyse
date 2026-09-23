# Gemini Extraction Schema Specification

## 1. Purpose
The purpose of this specification is to define the structured JSON schema used to instruct the Gemini LLM. It standardises how raw, unstructured opportunity messages (text, screenshots, etc.) are converted into structured facts, which are then evaluated by the deterministic ScamLens Risk Engine.

## 2. Gemini's Responsibility
Gemini functions strictly as an **Information Extraction component**. Its only job is to read user input and extract factual claims and patterns according to this exact schema, providing direct quotes as evidence for its extractions.

## 3. What Gemini must NOT do
Gemini must **never** make final decisions about legitimacy.
The schema and prompts explicitly forbid returning:
* `risk_score`
* `risk_level`
* `scam_probability`
* `scam_percentage`
* `scam_verdict`
* `legitimacy_score`
* `fraud_probability`

Gemini does **not** evaluate whether a company is genuine; it only extracts what the text claims.

## 4. Complete JSON Schema
```json
{
  "type": "object",
  "properties": {
    "opportunity_information": {
      "type": "object",
      "properties": {
        "company_name": { "type": ["string", "null"] },
        "role": { "type": ["string", "null"] },
        "opportunity_type": { "enum": ["internship", "job", "task_work", "course", "campus_ambassador", "contest", "other", "unknown"] },
        "description": { "type": ["string", "null"] },
        "source_platform": { "type": ["string", "null"] }
      }
    },
    "compensation": {
      "type": "object",
      "properties": {
        "salary_claim": { "$ref": "#/$defs/evidence_field_string" },
        "salary_amount": { "$ref": "#/$defs/evidence_field_string" },
        "salary_currency": { "$ref": "#/$defs/evidence_field_string" },
        "salary_frequency": { "$ref": "#/$defs/evidence_field_string" },
        "commission_claim": { "$ref": "#/$defs/evidence_field_boolean" },
        "guaranteed_earnings": { "$ref": "#/$defs/evidence_field_boolean" },
        "unrealistic_earning_language": { "$ref": "#/$defs/evidence_field_boolean" }
      }
    },
    "payment_requests": {
      "type": "object",
      "properties": {
        "payment_requested": { "$ref": "#/$defs/evidence_field_boolean" },
        "payment_amount": { "$ref": "#/$defs/evidence_field_string" },
        "payment_currency": { "$ref": "#/$defs/evidence_field_string" },
        "payment_reason": { "$ref": "#/$defs/evidence_field_string" },
        "payment_method": { 
          "type": "object",
          "properties": {
            "value": { "enum": ["bank_transfer", "UPI", "cryptocurrency", "wallet", "gift_card", "cash", "unknown"] },
            "confidence": { "type": "string" },
            "evidence": { "$ref": "#/$defs/evidence_array" }
          }
        },
        "payment_required_to_start": { "$ref": "#/$defs/evidence_field_boolean" },
        "payment_required_to_continue": { "$ref": "#/$defs/evidence_field_boolean" },
        "payment_required_to_withdraw": { "$ref": "#/$defs/evidence_field_boolean" }
      }
    },
    "task_scam_indicators": {
      "type": "object",
      "properties": {
        "task_work": { "$ref": "#/$defs/evidence_field_boolean" },
        "product_optimization": { "$ref": "#/$defs/evidence_field_boolean" },
        "product_boosting": { "$ref": "#/$defs/evidence_field_boolean" },
        "rating_tasks": { "$ref": "#/$defs/evidence_field_boolean" },
        "liking_tasks": { "$ref": "#/$defs/evidence_field_boolean" },
        "clicking_tasks": { "$ref": "#/$defs/evidence_field_boolean" },
        "commission_per_task": { "$ref": "#/$defs/evidence_field_boolean" },
        "deposit_to_unlock_tasks": { "$ref": "#/$defs/evidence_field_boolean" },
        "recharge_required": { "$ref": "#/$defs/evidence_field_boolean" },
        "negative_balance_claim": { "$ref": "#/$defs/evidence_field_boolean" }
      }
    },
    "financial_transfer_indicators": {
      "type": "object",
      "properties": {
        "check_deposit_request": { "$ref": "#/$defs/evidence_field_boolean" },
        "receive_money_request": { "$ref": "#/$defs/evidence_field_boolean" },
        "forward_money_request": { "$ref": "#/$defs/evidence_field_boolean" },
        "gift_card_purchase_request": { "$ref": "#/$defs/evidence_field_boolean" },
        "money_transfer_request": { "$ref": "#/$defs/evidence_field_boolean" }
      }
    },
    "recruitment_process": {
      "type": "object",
      "properties": {
        "unexpected_contact": { "$ref": "#/$defs/evidence_field_boolean" },
        "instant_selection": { "$ref": "#/$defs/evidence_field_boolean" },
        "interview_mentioned": { "$ref": "#/$defs/evidence_field_boolean" },
        "application_mentioned": { "$ref": "#/$defs/evidence_field_boolean" },
        "assessment_mentioned": { "$ref": "#/$defs/evidence_field_boolean" },
        "hiring_process_description": { "$ref": "#/$defs/evidence_field_string" }
      }
    },
    "contact_information": {
      "type": "object",
      "properties": {
        "recruiter_name": { "$ref": "#/$defs/evidence_field_string" },
        "recruiter_email": { "$ref": "#/$defs/evidence_field_string" },
        "recruiter_email_domain": { "$ref": "#/$defs/evidence_field_string" },
        "phone_number_present": { "$ref": "#/$defs/evidence_field_boolean" },
        "website_urls": { "type": "array", "items": { "type": "string" } },
        "social_media_urls": { "type": "array", "items": { "type": "string" } },
        "contact_method": { "$ref": "#/$defs/evidence_field_string" }
      }
    },
    "organisation_identity": {
      "type": "object",
      "properties": {
        "company_claimed": { "$ref": "#/$defs/evidence_field_string" },
        "official_domain_claimed": { "$ref": "#/$defs/evidence_field_string" },
        "personal_email_used": { "$ref": "#/$defs/evidence_field_boolean" },
        "company_identity_evidence": { "$ref": "#/$defs/evidence_field_string" }
      }
    },
    "sensitive_information_requests": {
      "type": "object",
      "properties": {
        "OTP": { "$ref": "#/$defs/evidence_field_boolean" },
        "password": { "$ref": "#/$defs/evidence_field_boolean" },
        "bank_account_details": { "$ref": "#/$defs/evidence_field_boolean" },
        "card_details": { "$ref": "#/$defs/evidence_field_boolean" },
        "Aadhaar": { "$ref": "#/$defs/evidence_field_boolean" },
        "PAN": { "$ref": "#/$defs/evidence_field_boolean" },
        "identity_document": { "$ref": "#/$defs/evidence_field_boolean" },
        "financial_credentials": { "$ref": "#/$defs/evidence_field_boolean" },
        "requested_information": { "type": "array", "items": { "type": "string" } },
        "reason_given": { "$ref": "#/$defs/evidence_field_string" },
        "request_stage": { "$ref": "#/$defs/evidence_field_string" }
      }
    },
    "urgency_and_pressure": {
      "type": "object",
      "properties": {
        "urgency_present": { "$ref": "#/$defs/evidence_field_boolean" },
        "urgency_phrases": { "type": "array", "items": { "type": "string" } },
        "deadline_claim": { "$ref": "#/$defs/evidence_field_string" },
        "threat_or_pressure": { "$ref": "#/$defs/evidence_field_boolean" },
        "pressure_to_pay": { "$ref": "#/$defs/evidence_field_boolean" },
        "pressure_to_share_information": { "$ref": "#/$defs/evidence_field_boolean" }
      }
    }
  },
  "$defs": {
    "evidence_array": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "quote": { "type": "string" },
          "source": { "enum": ["submitted_text"] }
        }
      }
    },
    "evidence_field_string": {
      "type": "object",
      "properties": {
        "value": { "type": ["string", "null"] },
        "confidence": { "enum": ["high", "medium", "low"] },
        "evidence": { "$ref": "#/$defs/evidence_array" }
      }
    },
    "evidence_field_boolean": {
      "type": "object",
      "properties": {
        "value": { "enum": [true, false, "unknown"] },
        "confidence": { "enum": ["high", "medium", "low"] },
        "evidence": { "$ref": "#/$defs/evidence_array" }
      }
    }
  }
}
```

## 5. Field Descriptions & Allowed Values
* **Opportunity Type**: Restricted to exactly: `internship, job, task_work, course, campus_ambassador, contest, other, unknown`.
* **Payment Method**: Restricted to exactly: `bank_transfer, UPI, cryptocurrency, wallet, gift_card, cash, unknown`.
* **Confidence**: Describes *extraction* confidence (`high, medium, low`), NOT scam probability.

## 6. TRUE / FALSE / UNKNOWN Rules
This is a critical requirement. Do not assume missing information implies a negative state.
* If the text mentions an interview occurring, `interview_mentioned = true`.
* If the text explicitly says "no interview required", `interview_mentioned = false`.
* If the text says nothing about interviews, `interview_mentioned = "unknown"`.

## 7. Evidence Requirements
Every fact extracted must have supporting evidence quoted directly from the user's submission.
* **fact**: The data point being extracted.
* **value**: The parsed value (string or boolean).
* **confidence**: Extraction certainty.
* **evidence**: An array of exact quotes, with source explicitly set to `"submitted_text"`.
* If no supporting evidence exists, the value must be `null` or `"unknown"` and evidence array empty.

## 8. No-Hallucination Rules
Gemini must never invent or assume:
* Company names, websites, or emails
* Salaries or payment requests
* Interview processes or social media accounts
* Verification statuses

Only extract what the submitted content literally claims.

---

## 9. Extraction Examples

### Example 1 (Task Scam)
**Input:** *"Congratulations! You have been selected for Amazon product optimisation work. Earn ₹5,000 every day. Pay ₹999 activation fee through USDT to start. Complete product optimisation tasks and receive commission."*

**Expected Extraction:**
* `company_claimed`: { "value": "Amazon", "evidence": [{"quote": "Amazon product optimisation work", "source": "submitted_text"}] }
* `opportunity_type`: "task_work"
* `role`: { "value": "product optimisation", "evidence": [{"quote": "product optimisation work", "source": "submitted_text"}] }
* `salary_claim`: { "value": "₹5,000/day", "evidence": [{"quote": "Earn ₹5,000 every day", "source": "submitted_text"}] }
* `payment_requested`: { "value": true, "evidence": [{"quote": "Pay ₹999 activation fee", "source": "submitted_text"}] }
* `payment_amount`: { "value": "₹999", "evidence": [{"quote": "Pay ₹999", "source": "submitted_text"}] }
* `payment_reason`: { "value": "activation fee", "evidence": [{"quote": "activation fee", "source": "submitted_text"}] }
* `payment_method`: { "value": "cryptocurrency", "evidence": [{"quote": "through USDT", "source": "submitted_text"}] }
* `task_work`: { "value": true, "evidence": [{"quote": "Complete product optimisation tasks", "source": "submitted_text"}] }
* `product_optimization`: { "value": true, "evidence": [{"quote": "product optimisation work", "source": "submitted_text"}] }
* `instant_selection`: { "value": true, "evidence": [{"quote": "Congratulations! You have been selected", "source": "submitted_text"}] }

*(No scam verdicts, probabilities, or fake evidence returned).*

### Example 2 (Normal Internship)
**Input:** *"ABC Technologies is hiring software engineering interns. Candidates should submit their resume and complete a technical interview. Selected interns receive ₹15,000/month. Apply through the company careers page."*

**Expected Extraction:**
* `company_claimed`: { "value": "ABC Technologies", "evidence": [{"quote": "ABC Technologies is hiring", "source": "submitted_text"}] }
* `role`: { "value": "software engineering intern", "evidence": [{"quote": "software engineering interns", "source": "submitted_text"}] }
* `opportunity_type`: "internship"
* `salary_claim`: { "value": "₹15,000/month", "evidence": [{"quote": "receive ₹15,000/month", "source": "submitted_text"}] }
* `application_mentioned`: { "value": true, "evidence": [{"quote": "submit their resume", "source": "submitted_text"}] }
* `interview_mentioned`: { "value": true, "evidence": [{"quote": "complete a technical interview", "source": "submitted_text"}] }
* `website_urls`: [] (or null/empty)
* `contact_method`: { "value": "careers page", "evidence": [{"quote": "Apply through the company careers page", "source": "submitted_text"}] }
* `payment_requested`: { "value": "unknown", "evidence": [] }

### Example 3 (Incomplete Message)
**Input:** *"Hi, I have a job opportunity for you. Earn good money from home. Contact me if interested."*

**Expected Extraction:**
* `company_claimed`: { "value": null, "evidence": [] }
* `role`: { "value": null, "evidence": [] }
* `salary_amount`: { "value": null, "evidence": [] }
* `payment_requested`: { "value": "unknown", "evidence": [] }
* `interview_mentioned`: { "value": "unknown", "evidence": [] }
* `website_urls`: []

---

## 10. Error/Failure Behaviour
If the text provided is utterly incomprehensible or not related to an opportunity, Gemini must return all keys with `null` or `"unknown"` values. It must not generate conversational error messages. The output must strictly adhere to the JSON schema.

## 11. Privacy Considerations
The input to this LLM component will have already been passed through a frontend/backend privacy redaction filter. Gemini's extraction output will remain temporary and contextual for the engine's evaluation.

---

## 12. Rule to Field Mapping

This mapping demonstrates how the structured facts from Gemini will trigger the deterministic Risk Rules defined in the Risk Engine.

| Risk Rule | Required Gemini Facts |
| :--- | :--- |
| **R01** | `payment_requested` + `payment_reason` + `payment_required_to_start` |
| **R02** | `payment_method` (where value is cryptocurrency or wallet) |
| **R03** | `sensitive_information_requests` (is true) + `request_stage` AND `reason_given` (must indicate premature or suspicious context, not standard post-hiring onboarding) |
| **R04** | `task_work` + (`product_optimization` OR `product_boosting` OR `rating_tasks` OR `liking_tasks`) |
| **R05** | `deposit_to_unlock_tasks` OR `recharge_required` |
| **R06** | `receive_money_request` OR `forward_money_request` OR `check_deposit_request` OR `gift_card_purchase_request` |
| **R07** | `company_claimed` (is true) + `personal_email_used` (is true) |
| **R08** | `unexpected_contact` |
| **R09** | `instant_selection` (is true) AND explicit evidence indicating no interview, screening, or evaluation (if simply not mentioned, it must remain UNKNOWN and R09 must not trigger) |
| **R10** | `guaranteed_earnings` OR `unrealistic_earning_language` |
| **R11** | `urgency_present` + (`pressure_to_pay` OR `threat_or_pressure`) |
