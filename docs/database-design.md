# ScamLens Database & Data Storage Specification

## 1. Database Purpose
The database is designed solely to support community-driven safety by allowing users to submit unverified feedback on evaluated opportunities and to recognize patterns across similar scams. It does **not** serve as a record of user activity or an archive of raw messages. 

## 2. Privacy Principles
ScamLens strictly adheres to **Data Minimization**. 
The application will NOT permanently store raw user opportunity messages, personal identifiers, or sensitive credentials. The database only persists privacy-safe metadata, fingerprints, and optional context. Raw opportunity text and images exist only as ephemeral processing data during the active analysis session and are immediately discarded.

---

## 3. Entity Design & Field Definitions

### Entity 1: `OpportunityFingerprint`
**Purpose:** Represents a privacy-safe, normalized pattern of an analysed opportunity. It allows the system to recognize similar scams without retaining the original text.
*   `fingerprint_id` (String/UUID, Primary Key)
*   `fingerprint_hash` (String, Unique) — The actual hashed canonical string.
*   `normalized_company_category` (String) — e.g., "ecommerce", "unknown", "tech_giant".
*   `opportunity_type` (String) — e.g., "task_work", "internship".
*   `sender_domain_category` (String) — e.g., "free_email", "corporate_domain".
*   `payment_pattern` (String) — e.g., "crypto_upfront", "none".
*   `task_pattern` (String) — e.g., "product_optimization".
*   `compensation_pattern` (String) — e.g., "unrealistic_guaranteed".
*   `risk_signal_pattern` (String) — Comma-separated list of triggered Rule IDs (e.g., "R01,R04,R05").
*   `created_at` (Timestamp)

### Entity 2: `UserFeedback`
**Purpose:** Allows users to optionally provide unverified community feedback after independently investigating an opportunity.
*   `feedback_id` (String/UUID, Primary Key)
*   `fingerprint_id` (String, Foreign Key)
*   `feedback_type` (Enum: `confirmed_suspicious`, `verified_legitimate`, `still_unsure`)
*   `optional_reason` (String) — A short, structured reason selected from a safe predefined list (e.g., "Company denied sending offer").
*   `created_at` (Timestamp)

### Entity 3: `AnalysisRecord`
**Purpose:** Stores minimal, non-sensitive metadata about system usage and risk trends.
*   `analysis_id` (String/UUID, Primary Key)
*   `fingerprint_id` (String, Foreign Key)
*   `risk_score` (Integer)
*   `risk_level` (Enum: `LOW`, `MODERATE`, `HIGH`, `VERY_HIGH`)
*   `opportunity_type` (String)
*   `evidence_signal_ids` (String) — List of triggered Rule IDs.
*   `created_at` (Timestamp)

*Note: Storing `AnalysisRecord` is technically optional for the core MVP analysis pipeline since the analysis is synchronous and ephemeral. However, it is useful for future trend analysis.*

---

## 4. Relationships
*   **OpportunityFingerprint (1) → (N) UserFeedback:** One fingerprint can accumulate multiple feedback entries from different users encountering the same pattern.
*   **OpportunityFingerprint (1) → (N) AnalysisRecord:** One fingerprint can map to multiple analysis sessions.

---

## 5. Fingerprint Generation Concept
To create a privacy-safe fingerprint, the system must never hash raw user input.
1.  **Normalize extracted facts:** Convert the output from the Gemini extraction schema into broad categories (e.g., "Amazon" → "tech_giant", "₹5000" → "high_daily_earning").
2.  **Redact:** Discard all specific emails, phone numbers, and URLs.
3.  **Canonical Representation:** Construct a structured, standardized string (e.g., `task_work|tech_giant|free_email|crypto_upfront|product_optimization`).
4.  **Hash:** Apply SHA-256 to the canonical string.
5.  **Persist:** Store only the resulting hash (`fingerprint_hash`) alongside the safe categorical metadata in `OpportunityFingerprint`.

---

## 6. Feedback Safety
User feedback must be strictly treated as **UNVERIFIED USER FEEDBACK**.
*   It must **NOT** retrain Gemini.
*   It must **NOT** modify Gemini's weights.
*   It must **NOT** automatically modify risk rules.
*   It must **NOT** automatically increase/decrease the live risk score of an ongoing analysis.
*   It must **NOT** be presented as verified truth.

In the future, data scientists or administrators can safely query aggregate feedback trends against fingerprints to manually tune the deterministic risk engine rules.

---

## 7. Privacy Boundary (Store vs. Do Not Store)

| DATA | STORE? | WHY? | RETENTION |
| :--- | :--- | :--- | :--- |
| **Raw opportunity text** | ❌ NO | Contains personal/sensitive data. | Ephemeral (Session only) |
| **Raw screenshot** | ❌ NO | Contains personal/sensitive data. | Ephemeral (Session only) |
| **Email address** | ❌ NO | PII. | Ephemeral (Session only) |
| **Phone number** | ❌ NO | PII. | Ephemeral (Session only) |
| **OTP / Passwords** | ❌ NO | Extreme security risk. | Ephemeral (Session only) |
| **PAN / Aadhaar** | ❌ NO | Extreme security risk / Illegal. | Ephemeral (Session only) |
| **Bank / Card info** | ❌ NO | Extreme security risk. | Ephemeral (Session only) |
| **Company name** | ❌ NO | Normalized to category instead. | Ephemeral (Session only) |
| **Opportunity type** | ✅ YES | Safe classification metric. | Persistent |
| **Risk score / level** | ✅ YES | Safe analytical metric. | Persistent |
| **Risk signals (Rule IDs)** | ✅ YES | Safe pattern metric. | Persistent |
| **Fingerprint (Hash)** | ✅ YES | Safely links recurring scams. | Persistent |
| **User feedback** | ✅ YES | Unverified community signals. | Persistent |
| **Timestamp** | ✅ YES | Trend analysis. | Persistent |

---

## 8. Index Recommendations
To keep the SQLite database lightweight and performant:
1.  **Index on `fingerprint_hash`** in `OpportunityFingerprint` (for fast pattern matching).
2.  **Index on `fingerprint_id`** in `UserFeedback` and `AnalysisRecord` (Foreign keys).
3.  **Index on `created_at`** (for chronological trend queries).

---

## 9. MVP Scope
*   **MUST HAVE:** Ephemeral analysis pipeline (User Input → Gemini → Risk Engine → UI). The core product works without a database.
*   **SHOULD HAVE:** `OpportunityFingerprint` and `AnalysisRecord` to prove the system can recognize patterns without storing raw data.
*   **FUTURE:** `UserFeedback`. Given tight hackathon deadlines, the feedback submission system and UI can be mocked or deferred to ensure the core analysis pipeline is flawless.

*Recommendation: Postpone database implementation until the core deterministic risk engine and Gemini extraction are fully integrated and functioning in memory.*

---

## 10. Judge Explanation
**"What data does ScamLens store?"**

*ScamLens is built on the principle of extreme data minimization. We do not permanently store raw opportunity messages, screenshots, emails, or sensitive credentials. The text you paste is only processed ephemerally in memory to extract structural facts.* 

*We only persist a privacy-safe "fingerprint" (a hashed pattern of the scam's mechanics) and basic metadata like the final risk score. We also allow users to submit optional, unverified community feedback linked to that fingerprint. This feedback never automatically changes the live risk engine—it merely provides a safe dataset for our engineers to analyze emerging scam trends without ever exposing user privacy.*
