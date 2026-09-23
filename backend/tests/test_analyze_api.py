import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
import io

from app.main import app
from app.schemas.gemini import GeminiExtractionSchema, Evidence
from tests.test_gemini import VALID_MOCK_RESPONSE
from app.services.gemini_service import GeminiExtractionError

client = TestClient(app)

def get_base_schema():
    import copy
    data = copy.deepcopy(VALID_MOCK_RESPONSE)
    data["opportunity_information"]["company_name"] = "Google"
    data["organisation_identity"]["company_claimed"]["value"] = "Google"
    return GeminiExtractionSchema(**data)
    
@patch("app.api.routes.analyze.extract_opportunity_facts")
def test_normal_internship(mock_extract):
    # TEST 1 — Normal internship
    schema = get_base_schema()
    schema.opportunity_information.opportunity_type = "internship"
    mock_extract.return_value = schema
    
    response = client.post("/api/v1/analyze", data={"opportunity_text": "This is a normal internship offer with clear process."})
    
    assert response.status_code == 200
    data = response.json()
    assert data["risk_indicator"]["score"] == 0
    assert data["risk_indicator"]["level"] == "LOW"

@patch("app.api.routes.analyze.extract_opportunity_facts")
def test_registration_fee(mock_extract):
    # TEST 2 — Registration fee
    schema = get_base_schema()
    schema.opportunity_information.opportunity_type = "internship"
    schema.payment_requests.payment_requested.value = True
    schema.payment_requests.payment_required_to_start.value = True
    schema.payment_requests.payment_required_to_start.evidence = [Evidence(quote="fee", source="submitted_text")]
    mock_extract.return_value = schema
    
    response = client.post("/api/v1/analyze", data={"opportunity_text": "An internship asking for ₹999 registration/activation fee."})
    assert response.status_code == 200
    data = response.json()
    assert data["risk_indicator"]["score"] == 20
    assert data["risk_indicator"]["level"] == "MODERATE"
    assert len(data["triggered_risk_signals"]) > 0
    assert any(s["rule_id"] == "R01" for s in data["triggered_risk_signals"])

@patch("app.api.routes.analyze.extract_opportunity_facts")
def test_high_risk_task_scam(mock_extract):
    # TEST 3 — High-risk task scam
    schema = get_base_schema()
    schema.task_scam_indicators.task_work.value = True
    schema.task_scam_indicators.product_optimization.value = True
    schema.payment_requests.payment_requested.value = True
    schema.payment_requests.payment_required_to_start.value = True
    schema.payment_requests.payment_method.value = "cryptocurrency"
    schema.recruitment_process.unexpected_contact.value = True
    mock_extract.return_value = schema
    
    response = client.post("/api/v1/analyze", data={"opportunity_text": "Unexpected whatsapp product optimisation work, ₹3,000/day, ₹999 activation fee, USDT payment."})
    assert response.status_code == 200
    data = response.json()
    # Group A: 20 (R01) + 30 (R02) = 50 -> cap at 50
    # Group C: 10 (R08)
    # Group D: 30 (R04)
    # Total: 90
    assert data["risk_indicator"]["score"] == 90
    assert data["risk_indicator"]["level"] == "VERY HIGH"

@patch("app.api.routes.analyze.extract_opportunity_facts")
def test_fake_internship(mock_extract):
    # TEST 4 — Fake internship
    schema = get_base_schema()
    schema.organisation_identity.company_claimed.value = "Amazon"
    schema.organisation_identity.personal_email_used.value = True
    schema.recruitment_process.instant_selection.value = True
    schema.recruitment_process.interview_mentioned.value = False
    schema.recruitment_process.interview_mentioned.evidence = [Evidence(quote="no interview", source="submitted_text")]
    schema.payment_requests.payment_requested.value = True
    schema.payment_requests.payment_required_to_start.value = True
    schema.payment_requests.payment_required_to_start.evidence = [Evidence(quote="registration fee", source="submitted_text")]
    mock_extract.return_value = schema
    
    response = client.post("/api/v1/analyze", data={"opportunity_text": "Gmail recruiter, instant selection, registration fee, explicit no interview required."})
    data = response.json()
    # Group A: 20 (R01), Group C: 20 (R07) + 15 (R09) = 35 -> capped at 30. Total: 50 (HIGH)
    assert data["risk_indicator"]["score"] == 50
    assert data["risk_indicator"]["level"] == "HIGH"

@patch("app.api.routes.analyze.extract_opportunity_facts")
def test_missing_information(mock_extract):
    # TEST 5 — Missing information
    schema = get_base_schema()
    schema.payment_requests.payment_requested.value = "unknown"
    schema.opportunity_information.company_name = None
    schema.organisation_identity.company_claimed.value = None
    mock_extract.return_value = schema
    
    response = client.post("/api/v1/analyze", data={"opportunity_text": "Hi, I have a job opportunity for you. Earn good money from home."})
    data = response.json()
    assert "payment_requested" in data["missing_information"]["fields"]
    assert data["opportunity_summary"]["company_claimed"] == "UNKNOWN"

def test_short_input():
    # TEST 6 — Short input
    response = client.post("/api/v1/analyze", data={"opportunity_text": "short"})
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "INVALID_INPUT"

def test_oversized_input():
    # TEST 7 — Oversized input
    response = client.post("/api/v1/analyze", data={"opportunity_text": "a" * 5001})
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "INVALID_INPUT"

@patch("app.api.routes.analyze.extract_opportunity_facts")
def test_gemini_unavailable(mock_extract):
    # TEST 8 — Gemini unavailable
    mock_extract.side_effect = GeminiExtractionError("Timeout connecting to Gemini")
    response = client.post("/api/v1/analyze", data={"opportunity_text": "Valid length input text."})
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "AI_UNAVAILABLE"

@patch("app.api.routes.analyze.extract_opportunity_facts")
def test_invalid_gemini_output(mock_extract):
    # TEST 9 — Invalid Gemini output
    mock_extract.side_effect = GeminiExtractionError("Validation error failed schema")
    response = client.post("/api/v1/analyze", data={"opportunity_text": "Valid length input text."})
    assert response.status_code == 500
    assert response.json()["error"]["code"] == "AI_INVALID_RESPONSE"

def test_screenshot_too_large():
    # TEST 10 — Screenshot too large
    large_file = io.BytesIO(b"0" * (5 * 1024 * 1024 + 1))
    response = client.post("/api/v1/analyze", data={"opportunity_text": "Valid length input text."}, files={"screenshot": ("large.jpg", large_file, "image/jpeg")})
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "FILE_TOO_LARGE"

def test_unsupported_screenshot_type():
    # TEST 11 — Unsupported screenshot type
    with open(__file__, "rb") as f:
        response = client.post("/api/v1/analyze", data={"opportunity_text": "Valid length input text."}, files={"screenshot": ("test.py", f, "text/plain")})
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "UNSUPPORTED_FILE"

@patch("app.api.routes.analyze.extract_text_from_file")
def test_extract_text_endpoint(mock_ocr):
    mock_ocr.return_value = "Extracted internship offer text from screenshot."
    fake_image = io.BytesIO(b"fake image bytes")
    response = client.post(
        "/api/v1/extract-text",
        files={"screenshot": ("test.png", fake_image, "image/png")}
    )
    assert response.status_code == 200
    assert response.json()["extracted_text"] == "Extracted internship offer text from screenshot."

@patch("app.api.routes.analyze.extract_text_from_file")
@patch("app.api.routes.analyze.extract_opportunity_facts")
def test_analyze_with_image_only(mock_extract, mock_ocr):
    from tests.test_gemini import VALID_MOCK_RESPONSE
    mock_ocr.return_value = "Legitimate software engineer internship offer at Google."
    mock_extract.return_value = GeminiExtractionSchema(**VALID_MOCK_RESPONSE)
    
    fake_image = io.BytesIO(b"fake image bytes")
    response = client.post(
        "/api/v1/analyze",
        data={},  # No text provided
        files={"screenshot": ("offer.png", fake_image, "image/png")}
    )
    assert response.status_code == 200
    assert "risk_indicator" in response.json()
    assert response.json()["extracted_text"] == "Legitimate software engineer internship offer at Google."
