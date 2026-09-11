import json
import pytest
from unittest.mock import patch, MagicMock
from pydantic import ValidationError

from app.services.gemini_service import extract_opportunity_facts, GeminiExtractionError
from app.core.config import settings
from app.schemas.gemini import GeminiExtractionSchema
from google.genai.errors import APIError

# A minimal valid JSON structure matching our GeminiExtractionSchema
VALID_MOCK_RESPONSE = {
    "opportunity_information": {
        "company_name": "MockCorp",
        "role": "Tester",
        "opportunity_type": "job",
        "description": None,
        "source_platform": None
    },
    "compensation": {
        "salary_claim": {"value": None, "confidence": "low", "evidence": []},
        "salary_amount": {"value": None, "confidence": "low", "evidence": []},
        "salary_currency": {"value": None, "confidence": "low", "evidence": []},
        "salary_frequency": {"value": None, "confidence": "low", "evidence": []},
        "commission_claim": {"value": "unknown", "confidence": "low", "evidence": []},
        "guaranteed_earnings": {"value": "unknown", "confidence": "low", "evidence": []},
        "unrealistic_earning_language": {"value": "unknown", "confidence": "low", "evidence": []}
    },
    "payment_requests": {
        "payment_requested": {"value": "unknown", "confidence": "low", "evidence": []},
        "payment_amount": {"value": None, "confidence": "low", "evidence": []},
        "payment_currency": {"value": None, "confidence": "low", "evidence": []},
        "payment_reason": {"value": None, "confidence": "low", "evidence": []},
        "payment_method": {"value": "unknown", "confidence": "low", "evidence": []},
        "payment_required_to_start": {"value": "unknown", "confidence": "low", "evidence": []},
        "payment_required_to_continue": {"value": "unknown", "confidence": "low", "evidence": []},
        "payment_required_to_withdraw": {"value": "unknown", "confidence": "low", "evidence": []}
    },
    "task_scam_indicators": {
        "task_work": {"value": "unknown", "confidence": "low", "evidence": []},
        "product_optimization": {"value": "unknown", "confidence": "low", "evidence": []},
        "product_boosting": {"value": "unknown", "confidence": "low", "evidence": []},
        "rating_tasks": {"value": "unknown", "confidence": "low", "evidence": []},
        "liking_tasks": {"value": "unknown", "confidence": "low", "evidence": []},
        "clicking_tasks": {"value": "unknown", "confidence": "low", "evidence": []},
        "commission_per_task": {"value": "unknown", "confidence": "low", "evidence": []},
        "deposit_to_unlock_tasks": {"value": "unknown", "confidence": "low", "evidence": []},
        "recharge_required": {"value": "unknown", "confidence": "low", "evidence": []},
        "negative_balance_claim": {"value": "unknown", "confidence": "low", "evidence": []}
    },
    "financial_transfer_indicators": {
        "check_deposit_request": {"value": "unknown", "confidence": "low", "evidence": []},
        "receive_money_request": {"value": "unknown", "confidence": "low", "evidence": []},
        "forward_money_request": {"value": "unknown", "confidence": "low", "evidence": []},
        "gift_card_purchase_request": {"value": "unknown", "confidence": "low", "evidence": []},
        "money_transfer_request": {"value": "unknown", "confidence": "low", "evidence": []}
    },
    "recruitment_process": {
        "unexpected_contact": {"value": "unknown", "confidence": "low", "evidence": []},
        "instant_selection": {"value": "unknown", "confidence": "low", "evidence": []},
        "interview_mentioned": {"value": "unknown", "confidence": "low", "evidence": []},
        "application_mentioned": {"value": "unknown", "confidence": "low", "evidence": []},
        "assessment_mentioned": {"value": "unknown", "confidence": "low", "evidence": []},
        "hiring_process_description": {"value": None, "confidence": "low", "evidence": []}
    },
    "contact_information": {
        "recruiter_name": {"value": None, "confidence": "low", "evidence": []},
        "recruiter_email": {"value": None, "confidence": "low", "evidence": []},
        "recruiter_email_domain": {"value": None, "confidence": "low", "evidence": []},
        "phone_number_present": {"value": "unknown", "confidence": "low", "evidence": []},
        "website_urls": [],
        "social_media_urls": [],
        "contact_method": {"value": None, "confidence": "low", "evidence": []}
    },
    "organisation_identity": {
        "company_claimed": {"value": None, "confidence": "low", "evidence": []},
        "official_domain_claimed": {"value": None, "confidence": "low", "evidence": []},
        "personal_email_used": {"value": "unknown", "confidence": "low", "evidence": []},
        "company_identity_evidence": {"value": None, "confidence": "low", "evidence": []}
    },
    "sensitive_information_requests": {
        "OTP": {"value": "unknown", "confidence": "low", "evidence": []},
        "password": {"value": "unknown", "confidence": "low", "evidence": []},
        "bank_account_details": {"value": "unknown", "confidence": "low", "evidence": []},
        "card_details": {"value": "unknown", "confidence": "low", "evidence": []},
        "Aadhaar": {"value": "unknown", "confidence": "low", "evidence": []},
        "PAN": {"value": "unknown", "confidence": "low", "evidence": []},
        "identity_document": {"value": "unknown", "confidence": "low", "evidence": []},
        "financial_credentials": {"value": "unknown", "confidence": "low", "evidence": []},
        "requested_information": [],
        "reason_given": {"value": None, "confidence": "low", "evidence": []},
        "request_stage": {"value": None, "confidence": "low", "evidence": []}
    },
    "urgency_and_pressure": {
        "urgency_present": {"value": "unknown", "confidence": "low", "evidence": []},
        "urgency_phrases": [],
        "deadline_claim": {"value": None, "confidence": "low", "evidence": []},
        "threat_or_pressure": {"value": "unknown", "confidence": "low", "evidence": []},
        "pressure_to_pay": {"value": "unknown", "confidence": "low", "evidence": []},
        "pressure_to_share_information": {"value": "unknown", "confidence": "low", "evidence": []}
    }
}

def test_missing_api_key():
    settings.GEMINI_API_KEY = None
    with pytest.raises(GeminiExtractionError) as exc_info:
        extract_opportunity_facts("Some text")
    assert "GEMINI_API_KEY is not configured" in str(exc_info.value) or "missing" in str(exc_info.value)

@patch("app.services.gemini_service.genai.Client")
def test_valid_gemini_extraction(mock_client_class):
    # Set a dummy key to bypass the first check
    settings.GEMINI_API_KEY = "dummy_key"
    
    mock_response = MagicMock()
    mock_response.text = json.dumps(VALID_MOCK_RESPONSE)
    
    mock_client_instance = mock_client_class.return_value
    mock_client_instance.models.generate_content.return_value = mock_response
    
    result = extract_opportunity_facts("Dummy text")
    
    assert isinstance(result, GeminiExtractionSchema)
    assert result.opportunity_information.company_name == "MockCorp"

@patch("app.services.gemini_service.genai.Client")
def test_invalid_json_schema(mock_client_class):
    settings.GEMINI_API_KEY = "dummy_key"
    
    # Return missing fields
    mock_response = MagicMock()
    mock_response.text = '{"opportunity_information": {}}' 
    
    mock_client_instance = mock_client_class.return_value
    mock_client_instance.models.generate_content.return_value = mock_response
    
    with pytest.raises(GeminiExtractionError) as exc_info:
        extract_opportunity_facts("Dummy text")
    
    assert "SCHEMA_VALIDATION_FAILED" in str(exc_info.value)
