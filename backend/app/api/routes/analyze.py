from fastapi import APIRouter, Form, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from typing import Optional
import uuid
import time
import logging

from app.schemas.api import (
    AnalysisResponse, AnalysisMetadata, RiskIndicator, TriggeredRiskSignal, SafeRiskSignal,
    VerificationInformation, MissingInformation, ErrorResponse, ErrorDetails
)
from app.services.redaction_service import redact_text
from app.services.gemini_service import extract_opportunity_facts, GeminiExtractionError
from app.services.risk_engine import evaluate_risk
from app.schemas.gemini import GeminiExtractionSchema

router = APIRouter()
logger = logging.getLogger(__name__)

class APIException(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code

@router.post("/analyze", response_model=AnalysisResponse, responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def analyze_opportunity(
    opportunity_text: str = Form(...),
    source_platform: Optional[str] = Form(None),
    user_applied: Optional[bool] = Form(None),
    sender_email: Optional[str] = Form(None),
    sender_website: Optional[str] = Form(None),
    salary_or_incentive: Optional[str] = Form(None),
    user_concern: Optional[str] = Form(None),
    screenshot: Optional[UploadFile] = File(None)
):
    start_time = time.time()
    analysis_id = str(uuid.uuid4())
    
    try:
        # 1. Validate Text Input
        if not opportunity_text or len(opportunity_text) < 10:
            raise APIException("INVALID_INPUT", "The opportunity text must be at least 10 characters long.")
        if len(opportunity_text) > 5000:
            raise APIException("INVALID_INPUT", "The opportunity text exceeds the 5000 character limit.")
            
        # 2. Validate Screenshot
        if screenshot:
            if screenshot.content_type not in ["image/png", "image/jpeg", "image/jpg"]:
                raise APIException("UNSUPPORTED_FILE", "Screenshot must be a PNG or JPG image.")
            
            # Check size by reading to memory (safe since it's capped at 5MB)
            file_bytes = await screenshot.read()
            if len(file_bytes) > 5 * 1024 * 1024:
                raise APIException("FILE_TOO_LARGE", "Screenshot file size exceeds 5MB.")
            # Note: File is safely ignored for analysis as per requirements
        
        # 3. Privacy Redaction
        redacted_text = redact_text(opportunity_text)
        
        # Build prompt payload
        input_payload = f"Message: {redacted_text}"
        if source_platform: input_payload += f"\nPlatform: {source_platform}"
        if sender_email: input_payload += f"\nSender Email: {sender_email}"
        if sender_website: input_payload += f"\nSender Website: {sender_website}"
        if salary_or_incentive: input_payload += f"\nSalary/Incentive context: {salary_or_incentive}"
        
        # 4. Gemini Extraction
        try:
            extraction_schema: GeminiExtractionSchema = extract_opportunity_facts(input_payload)
        except GeminiExtractionError as e:
            error_msg = str(e)
            if "validation error" in error_msg.lower() or "schema" in error_msg.lower():
                raise APIException("AI_INVALID_RESPONSE", "The AI extraction service returned an invalid response structure.", status_code=500)
            else:
                # Cleanly report the real cause as requested
                # e.g., "AI_UNAVAILABLE: Gemini API Error. 404 NOT_FOUND..."
                clean_msg = error_msg.split(": ", 1)[-1] if ": " in error_msg else error_msg
                raise APIException("AI_UNAVAILABLE", clean_msg, status_code=503)
                
        # 5. Risk Engine
        try:
            risk_report = evaluate_risk(extraction_schema)
        except Exception as e:
            logger.error(f"Risk Engine failure: {str(e)}")
            raise APIException("ANALYSIS_FAILED", "The risk evaluation engine failed to process the extracted facts.", status_code=500)
            
        # 6. Build API Response
        
        # Opportunity Summary
        opp_info = extraction_schema.opportunity_information
        comp_info = extraction_schema.compensation
        org = extraction_schema.organisation_identity
        contact = extraction_schema.contact_information

        extracted_company = (
            opp_info.company_name.value if opp_info.company_name and hasattr(opp_info.company_name, "value")
            else (opp_info.company_name or (org.company_claimed.value if org.company_claimed and hasattr(org.company_claimed, "value") else org.company_claimed) or "UNKNOWN")
        )
        extracted_role = (
            opp_info.role.value if opp_info.role and hasattr(opp_info.role, "value")
            else (opp_info.role or "UNKNOWN")
        )
        extracted_salary = (
            comp_info.salary_amount.value if comp_info.salary_amount and hasattr(comp_info.salary_amount, "value")
            else (comp_info.salary_amount or None)
        )

        summary = {
            "company_claimed": extracted_company,
            "role": extracted_role,
            "opportunity_type": opp_info.opportunity_type,
            "salary_claim": extracted_salary
        }
        
        # Extracted Facts (just pulling a few highlights)
        pr = extraction_schema.payment_requests
        rp = extraction_schema.recruitment_process
        facts = {
            "payment_requested": pr.payment_requested.value if pr.payment_requested else "UNKNOWN",
            "payment_amount": pr.payment_amount.value if pr.payment_amount else "UNKNOWN",
            "instant_selection": rp.instant_selection.value if rp.instant_selection else "UNKNOWN",
            "interview_mentioned": rp.interview_mentioned.value if rp.interview_mentioned else "UNKNOWN"
        }
        
        # Triggered Signals Mapping
        api_signals = []
        recommended_actions = []
        for sig in risk_report.triggered_signals:
            # Map RiskReport triggered signals to API models
            first_quote = sig.evidence[0].quote if sig.evidence else None
            api_signals.append(TriggeredRiskSignal(
                rule_id=sig.rule_id,
                title=sig.title,
                points=sig.points,
                severity=sig.severity,
                evidence_quote=first_quote,
                explanation=sig.explanation
            ))
            if sig.recommended_action not in recommended_actions:
                recommended_actions.append(sig.recommended_action)
                
        if not recommended_actions:
            recommended_actions.append("Proceed with normal caution and independently verify the opportunity.")

        # Safe Signals Mapping
        api_safe_signals = []
        for sig in getattr(risk_report, "safe_signals", []):
            first_quote = sig.evidence[0].quote if sig.evidence else None
            api_safe_signals.append(SafeRiskSignal(
                rule_id=sig.rule_id,
                title=sig.title,
                points=sig.points,
                confidence="high",
                evidence_quote=first_quote,
                explanation=sig.explanation
            ))
            
        # Missing Information
        missing = []
        if facts["payment_requested"] == "unknown":
            missing.append("payment_requested")
        if facts["interview_mentioned"] == "unknown":
            missing.append("interview_mentioned")
            
        missing_prompt = "Providing more context could improve the analysis."
        if missing:
            missing_prompt = f"We could not determine: {', '.join(missing)}. Providing this could improve the analysis."

        # Verification Information
        found_website = contact.website_urls[0] if contact.website_urls else None
        ac = getattr(extraction_schema, "application_channel", None)
        if not found_website and ac and ac.form_url and ac.form_url.value:
            found_website = ac.form_url.value
            
        verif = VerificationInformation(
            company=extracted_company if extracted_company != "UNKNOWN" else None,
            website=found_website,
            email=contact.recruiter_email.value if contact.recruiter_email and hasattr(contact.recruiter_email, "value") else None,
            social_links=contact.social_media_urls,
            domain_verification_available=False
        )
        
        # Calculate process time
        process_ms = int((time.time() - start_time) * 1000)
        
        # Build metadata
        from datetime import datetime, timezone
        metadata = AnalysisMetadata(
            analysis_id=analysis_id,
            timestamp=datetime.now(timezone.utc).isoformat(),
            processing_time_ms=process_ms
        )
        
        indicator = RiskIndicator(
            score=risk_report.score,
            level=risk_report.level,
            evidence_coverage="high" if len(api_signals) > 0 else "low"
        )
        
        return AnalysisResponse(
            analysis_metadata=metadata,
            risk_indicator=indicator,
            opportunity_summary=summary,
            extracted_facts=facts,
            triggered_risk_signals=api_signals,
            safe_signals=api_safe_signals,
            recommended_actions=recommended_actions,
            verification_information=verif,
            missing_information=MissingInformation(fields=missing, prompt=missing_prompt)
        )

    except APIException as e:
        return JSONResponse(
            status_code=e.status_code,
            content={"error": {"code": e.code, "message": e.message, "details": None}}
        )
    except Exception as e:
        logger.error(f"Internal API Error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred during processing.", "details": None}}
        )
