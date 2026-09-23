# ScamCheck Architecture

## Interactive Investigation Workflow

1. **Input Methods**: Students can provide opportunity information through:
   - Pasted message/text
   - Typed description in their own words
   - Screenshot/image of an offer (Optional)
2. **Fact Extraction**: The system uses the Gemini API to extract available facts from the messy user input and explain detected evidence in simple language.
3. **Interactive Clarification**: If critical information needed for stronger analysis is missing, the assistant may ask the user for **ONE** missing piece of information at a time. If the user does not know the answer, the system must **never** invent or hallucinate the information. It will continue with available evidence and clearly state its limitations.
4. **External Research**: If reliable external research is available, the system may research company/domain/opportunity information and use those results as additional evidence (without claiming to search the entire internet).
5. **Deterministic Risk Engine**: A rule-based, deterministic risk engine is strictly responsible for calculating the final risk indicator based on the extracted facts. Gemini **must not** independently decide the final risk score.
6. **Final Result Presentation**: The final result will display:
   - Opportunity category
   - Risk indicator and risk level
   - Extracted facts and exact evidence
   - Warning signals
   - External research evidence (when available)
   - Company/official links (when confidently identified)
   - Safe verification actions
7. **Feedback Loop**: After independent verification, users can optionally provide feedback (`confirmed suspicious`, `verified legitimate`, `still unsure`).
   - Feedback must be privacy-safe.
   - It **must not** automatically retrain the production AI model during the hackathon. It is reserved for future pattern retrieval, evaluation, and model improvement.

## Data Flow
1. **Client -> API (`/api/investigate`)**: User submits text/screenshot.
2. **API -> Gemini API**: Sends unstructured input to extract structured facts and evidence.
3. **API -> External Services (Optional)**: Queries specific sources for domain/company validation.
4. **API -> Risk Engine**: Feeds extracted facts and research into the deterministic rules engine to generate a risk score.
5. **API -> Client**: Returns either a clarification question (if critical info is missing) or the structured final result.
6. **Client -> API (`/api/feedback`)**: User submits optional feedback on the result.

## API Contract (Draft)

**POST /api/investigate**
- **Request**: `{ text_input: string, image_input: File | null }`
- **Response**:
  ```json
  {
    "status": "complete" | "needs_clarification",
    "clarification_question": "string (optional)",
    "result": {
      "category": "string",
      "risk_indicator": "number",
      "risk_level": "Low | Medium | High",
      "extracted_facts": ["fact1", "fact2"],
      "warning_signals": ["signal1", "signal2"],
      "evidence": ["evidence1", "evidence2"],
      "external_research": ["research1"],
      "official_links": ["url1"],
      "safe_actions": ["action1"]
    }
  }
  ```

**POST /api/feedback**
- **Request**: `{ investigation_id: string, feedback: "suspicious" | "legitimate" | "unsure" }`
- **Response**: `{ "success": true }`

## Privacy Boundaries
- **No Hallucination**: AI must strictly state limitations if facts are unknown.
- **Feedback Isolation**: User feedback is explicitly separated from the production model weights.
- **Minimal Collection**: The system only extracts information relevant to scam analysis.

## MVP Priorities

### MUST HAVE (5-Hour MVP)
- Core text-analysis flow (pasted messages or typed descriptions).
- Gemini API integration for structured fact extraction and evidence explanation.
- Deterministic risk engine to compute the final risk score based on AI-extracted facts.
- Final result display (category, risk level, facts, warning signals, evidence, safe actions).
- Fallback behavior when information is missing (stating limitations instead of hallucinating).

### SHOULD HAVE (If time permits)
- Interactive clarification flow (asking ONE question at a time).
- Optional privacy-safe user feedback mechanism.
- Basic external research (e.g., simple domain check).

### FUTURE / OUT OF SCOPE
- **Screenshot/Image Processing**: Treated strictly as an optional enhancement. The core text-analysis flow must work independently to ensure the demo does not break.
- Automated model retraining pipeline.
- Comprehensive web scraping/searching the entire internet.
