import json
from google import genai
from google.genai import types
from pydantic import ValidationError
from google.genai.errors import APIError

from app.core.config import settings
from app.schemas.gemini import GeminiExtractionSchema
from app.services.redaction_service import redact_text

class GeminiExtractionError(Exception):
    """Custom exception for Gemini extraction failures."""
    pass

def get_gemini_client() -> genai.Client:
    """Initialize the Gemini client."""
    if not settings.GEMINI_API_KEY:
        raise GeminiExtractionError("GEMINI_API_KEY is not configured.")
    return genai.Client(api_key=settings.GEMINI_API_KEY)

def extract_opportunity_facts(raw_text: str) -> GeminiExtractionSchema:
    """
    Redacts privacy-sensitive info, then uses Gemini to extract structured facts.
    """
    if not settings.GEMINI_API_KEY:
        raise GeminiExtractionError("AI_UNAVAILABLE: Gemini API key is missing.")

    try:
        client = get_gemini_client()
    except Exception as e:
        raise GeminiExtractionError(f"AI_UNAVAILABLE: Failed to configure Gemini. {str(e)}")

    redacted_text = redact_text(raw_text)

    prompt = f"""You are an information extraction system for ScamLens.

Extract only facts explicitly supported by the submitted content.
Do not determine whether the opportunity is a scam.
Do not estimate risk.
Do not invent missing information.
Use "unknown" or null when information is not explicitly available.
Every important extracted fact MUST have exact supporting evidence quoted directly from the submitted content.
Do NOT fabricate evidence. If there is no evidence, the evidence array must be empty and the value null/"unknown".

Submitted Content:
\"\"\"
{redacted_text}
\"\"\"
"""

    try:
        # Using the currently recommended model for structured tasks in google-genai
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=GeminiExtractionSchema,
                temperature=0.0, # Zero temperature for deterministic extraction
            )
        )
        
        if not response.text:
            raise GeminiExtractionError("AI_INVALID_RESPONSE: Empty response from model.")

        # The SDK returns a JSON string that conforms to the schema.
        # We parse it and validate it strictly through our Pydantic model.
        data = json.loads(response.text)
        validated_schema = GeminiExtractionSchema(**data)
        return validated_schema

    except ValidationError as ve:
        raise GeminiExtractionError(f"SCHEMA_VALIDATION_FAILED: Model returned invalid structure. {str(ve)}")
    except json.JSONDecodeError:
        raise GeminiExtractionError("AI_INVALID_RESPONSE: Model did not return valid JSON.")
    except APIError as e:
        raise GeminiExtractionError(f"AI_UNAVAILABLE: Gemini API Error. {str(e)}")
    except Exception as e:
        raise GeminiExtractionError(f"AI_UNAVAILABLE: An unexpected error occurred communicating with Gemini. {str(e)}")
