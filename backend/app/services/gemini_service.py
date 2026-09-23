import json
import logging
from typing import List
from google import genai
from google.genai import types
from pydantic import ValidationError
from google.genai.errors import APIError

from app.core.config import settings
from app.schemas.gemini import GeminiExtractionSchema
from app.services.redaction_service import redact_text

logger = logging.getLogger(__name__)

class GeminiExtractionError(Exception):
    """Custom exception for Gemini extraction failures."""
    pass

# Global key rotation index
_active_key_index = 0

def get_available_keys() -> List[str]:
    """Retrieve all available Gemini API keys from settings."""
    keys = settings.get_gemini_keys()
    return keys

def get_gemini_client(api_key: str) -> genai.Client:
    """Initialize a Gemini client for a specific API key."""
    if not api_key:
        raise GeminiExtractionError("Gemini API key is empty.")
    return genai.Client(api_key=api_key)

def extract_opportunity_facts(raw_text: str) -> GeminiExtractionSchema:
    """
    Redacts privacy-sensitive info, then uses Gemini to extract structured facts.
    Automatically cycles through configured Gemini API keys if quota/limits are reached.
    """
    global _active_key_index
    keys = get_available_keys()
    if not keys:
        raise GeminiExtractionError("AI_UNAVAILABLE: No Gemini API keys configured.")

    redacted_text = redact_text(raw_text)
    schema_json = json.dumps(GeminiExtractionSchema.model_json_schema())

    prompt = f"""You are an information extraction system for Scamalyse.

Extract facts from the submitted content and output ONLY a valid JSON object strictly adhering to this JSON Schema:
{schema_json}

Strict rules:
1. Extract only facts explicitly supported by the submitted content.
2. Do not determine whether the opportunity is a scam.
3. Do not estimate risk.
4. Do not invent missing information.
5. Use "unknown" or null when information is not explicitly available.
6. Every important extracted fact MUST have exact supporting evidence quoted directly from the submitted content.
7. Do NOT fabricate evidence. If there is no evidence, the evidence array must be empty and the value null/"unknown".
8. For training_disguised_as_internship:
   - training_required_before_work: true if mandatory training/coursework is required before work/placement.
   - admissions_team_sender: true if sender is an "Admissions Team" or course/academic coordinator instead of HR.
   - coursework_prerequisite_for_placement: true if placement assistance is conditional on completing coursework.
9. For institutional_endorsement:
   - government_or_regulatory_collaboration_claimed: true if collaboration with AICTE, MSME, UGC, Skill India, etc. is claimed.
   - official_affiliation_verified: true only if official government domain (.gov.in, .nic.in, aicte-india.org) is provided for the opportunity; false if using third-party/free forms.
10. For application_channel:
   - public_form_used: true if application link is a Google Form (forms.gle, docs.google.com/forms), Typeform, etc.
   - vague_partner_claims: true if vague "MNC partners" or unnamed corporate partners are claimed without specific names.

Submitted Content:
\"\"\"
{redacted_text}
\"\"\"
"""

    num_keys = len(keys)
    start_idx = _active_key_index % num_keys
    last_exception = None

    for attempt in range(num_keys):
        key_idx = (start_idx + attempt) % num_keys
        active_key = keys[key_idx]

        try:
            logger.info(f"Attempting Gemini extraction with API key index {key_idx + 1}/{num_keys}...")
            client = get_gemini_client(active_key)
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.0,
                )
            )

            if not response.text:
                raise GeminiExtractionError("AI_INVALID_RESPONSE: Empty response from model.")

            data = json.loads(response.text)
            validated_schema = GeminiExtractionSchema(**data)

            # Successfully processed with this key - persist this index
            _active_key_index = key_idx
            return validated_schema

        except ValidationError as parse_err:
            # Model response violates the strict Pydantic schema
            raise GeminiExtractionError(f"SCHEMA_VALIDATION_FAILED: Model returned invalid structure. {str(parse_err)}")

        except json.JSONDecodeError as json_err:
            logger.warning(f"Key index {key_idx + 1} produced non-JSON response: {json_err}. Switching key...")
            last_exception = json_err
            continue

        except (APIError, Exception) as api_err:
            # Rate limit (429), Quota Exceeded, disconnect, or client error: switch key
            logger.warning(
                f"Gemini API key {key_idx + 1}/{num_keys} encountered error or limit reached: {api_err}. "
                f"Switching to next configured API key..."
            )
            last_exception = api_err
            continue

    # If all keys failed
    raise GeminiExtractionError(
        f"AI_UNAVAILABLE: All {num_keys} configured Gemini API keys failed or exceeded limits. Last error: {str(last_exception)}"
    )

def extract_text_from_file(file_bytes: bytes, mime_type: str = "image/png") -> str:
    """
    Extracts all visible text and details from an uploaded file (image or PDF) using Gemini.
    Automatically cycles through configured Gemini API keys if quota/limits are reached.
    """
    global _active_key_index
    keys = get_available_keys()
    if not keys:
        raise GeminiExtractionError("AI_UNAVAILABLE: No Gemini API keys configured.")

    prompt = (
        "Extract all readable text, email headers, sender information, job or internship offer details, "
        "requirements, compensation, links, and contact information from this document/image verbatim. "
        "Return strictly the extracted textual content without any introductory or conversational markdown commentary."
    )

    num_keys = len(keys)
    start_idx = _active_key_index % num_keys
    last_exception = None

    for attempt in range(num_keys):
        key_idx = (start_idx + attempt) % num_keys
        active_key = keys[key_idx]

        try:
            logger.info(f"Attempting image OCR extraction with Gemini API key index {key_idx + 1}/{num_keys}...")
            client = get_gemini_client(active_key)
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=[
                    types.Part.from_bytes(data=file_bytes, mime_type=mime_type),
                    prompt
                ],
                config=types.GenerateContentConfig(
                    temperature=0.0,
                )
            )

            if not response.text or not response.text.strip():
                raise GeminiExtractionError("AI_INVALID_RESPONSE: No text could be detected or extracted from the image.")

            text = response.text.strip()
            # Clean possible markdown fence wrapping
            if text.startswith("```") and text.endswith("```"):
                lines = text.splitlines()
                if len(lines) >= 3:
                    text = "\n".join(lines[1:-1]).strip()

            _active_key_index = key_idx
            return text

        except (APIError, Exception) as api_err:
            logger.warning(
                f"Gemini API key {key_idx + 1}/{num_keys} encountered error during image OCR: {api_err}. "
                f"Switching to next configured API key..."
            )
            last_exception = api_err
            continue

    raise GeminiExtractionError(
        f"AI_UNAVAILABLE: All {num_keys} configured Gemini API keys failed during image OCR. Last error: {str(last_exception)}"
    )
