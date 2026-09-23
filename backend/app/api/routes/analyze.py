from fastapi import APIRouter, Form, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from typing import Optional
import uuid
import time
import logging

from app.schemas.api import (
    AnalysisResponse, AnalysisMetadata, RiskIndicator, TriggeredRiskSignal, SafeRiskSignal,
    VerificationInformation, EmailVerificationDetails, WebsiteInspectionDetails,
    CorporateVerificationDetails,
    MissingInformation, ErrorResponse, ErrorDetails
)
from pydantic import BaseModel
from app.services.redaction_service import redact_text
from app.services.gemini_service import extract_opportunity_facts, extract_text_from_file, GeminiExtractionError
# Backward compatibility alias
extract_text_from_image = extract_text_from_file
from app.services.email_domain_verifier import verify_email_domain, EmailDomainReport
from app.services.domain_inspector import inspect_domain, extract_urls_from_text, DomainInspectionReport
from app.services.risk_engine import evaluate_risk
from app.schemas.gemini import GeminiExtractionSchema

from app.db.session import SessionLocal
from app.db.models import AnalysisCache
import hashlib
import json

router = APIRouter()
logger = logging.getLogger(__name__)

class APIException(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code

class ExtractTextResponse(BaseModel):
    extracted_text: str

@router.post("/extract-text", response_model=ExtractTextResponse, responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def extract_text_from_screenshot(
    screenshot: UploadFile = File(...)
):
    """
    Extracts readable text from an uploaded screenshot using Gemini Vision OCR.
    """
    allowed_types = ["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"]
    if screenshot.content_type not in allowed_types:
        return JSONResponse(
            status_code=400,
            content={"error": {"code": "UNSUPPORTED_FILE", "message": "Screenshot or document must be a PNG, JPG, WEBP, or PDF."}}
        )

    file_bytes = await screenshot.read()
    if len(file_bytes) > 5 * 1024 * 1024:
        return JSONResponse(
            status_code=400,
            content={"error": {"code": "FILE_TOO_LARGE", "message": "Screenshot file size exceeds 5MB limit."}}
        )
    if len(file_bytes) == 0:
        return JSONResponse(
            status_code=400,
            content={"error": {"code": "INVALID_INPUT", "message": "Uploaded image file is empty."}}
        )

    try:
        text = extract_text_from_file(file_bytes, mime_type=screenshot.content_type)
        return ExtractTextResponse(extracted_text=text)
    except GeminiExtractionError as e:
        return JSONResponse(
            status_code=503,
            content={"error": {"code": "AI_UNAVAILABLE", "message": str(e)}}
        )
    except Exception as e:
        logger.error(f"Image OCR error: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": {"code": "OCR_FAILED", "message": "Failed to extract text from the uploaded screenshot."}}
        )

@router.post("/analyze", response_model=AnalysisResponse, responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def analyze_opportunity(
    opportunity_text: Optional[str] = Form(None),
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
    extracted_from_image = None
    
    try:
        # Handle Screenshot OCR if uploaded
        if screenshot:
            allowed_types = ["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"]
            if screenshot.content_type not in allowed_types:
                raise APIException("UNSUPPORTED_FILE", "Screenshot or document must be a PNG, JPG, WEBP, or PDF.")
            
            file_bytes = await screenshot.read()
            if len(file_bytes) > 5 * 1024 * 1024:
                raise APIException("FILE_TOO_LARGE", "Screenshot file size exceeds 5MB.")
            
            # If no manual text provided, extract directly from the screenshot
            if not opportunity_text or len(opportunity_text.strip()) < 10:
                try:
                    extracted_from_image = extract_text_from_file(file_bytes, mime_type=screenshot.content_type)
                    opportunity_text = extracted_from_image
                except GeminiExtractionError as e:
                    raise APIException("AI_UNAVAILABLE", f"Could not read text from uploaded screenshot: {str(e)}", status_code=503)

        # 1. Validate Text Input
        if not opportunity_text or len(opportunity_text.strip()) < 10:
            raise APIException("INVALID_INPUT", "Please paste opportunity text or upload an image with readable text (at least 10 characters).")
        if len(opportunity_text) > 5000:
            raise APIException("INVALID_INPUT", "The opportunity text exceeds the 5000 character limit.")
            
        # 2. Privacy Redaction
        redacted_text = redact_text(opportunity_text)
        
        # 3. Cache Check
        raw_string = f"{opportunity_text}|{sender_email or ''}"
        input_hash = hashlib.sha256(raw_string.encode('utf-8')).hexdigest()
        analysis_id = input_hash # Overwrite random uuid
        
        db = SessionLocal()
        try:
            cached_result = db.query(AnalysisCache).filter(AnalysisCache.input_hash == input_hash).first()
            if cached_result:
                cached_data = json.loads(cached_result.response_payload)
                cached_data["analysis_metadata"]["processing_time_ms"] = int((time.time() - start_time) * 1000)
                from datetime import datetime, timezone
                cached_data["analysis_metadata"]["timestamp"] = datetime.now(timezone.utc).isoformat()
                return AnalysisResponse(**cached_data)
        finally:
            db.close()
        
        # Build prompt payload
        input_payload = f"Message: {redacted_text}"
        if source_platform: input_payload += f"\nPlatform: {source_platform}"
        if sender_email: input_payload += f"\nSender Email: {sender_email}"
        if sender_website: input_payload += f"\nSender Website: {sender_website}"
        if salary_or_incentive: input_payload += f"\nSalary/Incentive context: {salary_or_incentive}"
        # Resolve target website early for Deep OSINT
        from app.services.domain_inspector import extract_urls_from_text
        from app.services.web_scraper import fetch_and_extract_text

        target_website = None
        if sender_website and sender_website.strip():
            target_website = sender_website.strip()
        else:
            extracted_urls = extract_urls_from_text(opportunity_text or "")
            if extracted_urls:
                target_website = extracted_urls[0]

        if target_website:
            logger.info(f"Deep OSINT: Identified target website {target_website}, attempting scrape.")
            scraped_content = fetch_and_extract_text(target_website)
            if scraped_content:
                input_payload += f"\n\n[Deep OSINT] Extracted Website Content for {target_website}:\n{scraped_content}"

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
                
        # 5. Extract Details & Run Email Verification
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

        from app.services.corporate_registry import verify_corporate_entity
        corporate_report = verify_corporate_entity(extracted_company)
        # Inject the company name so the risk engine can use it in signal titles
        corporate_report["company_name"] = extracted_company

        summary = {
            "company_claimed": extracted_company,
            "role": extracted_role,
            "opportunity_type": opp_info.opportunity_type,
            "salary_claim": extracted_salary,
            "corporate_registry_status": corporate_report["status"]
        }

        # Resolve target email to inspect
        target_email = None
        if sender_email and sender_email.strip():
            target_email = sender_email.strip()
        elif contact.recruiter_email and hasattr(contact.recruiter_email, "value") and contact.recruiter_email.value:
            target_email = str(contact.recruiter_email.value).strip()

        email_report = None
        if target_email and "@" in target_email:
            try:
                email_report = verify_email_domain(target_email, claimed_company=extracted_company)
            except Exception as err:
                logger.warning(f"Email domain verification error: {err}")

        # Resolve target website to inspect
        target_website = None
        if sender_website and sender_website.strip():
            target_website = sender_website.strip()
        elif contact.website_urls:
            target_website = contact.website_urls[0]
        else:
            ac = getattr(extraction_schema, "application_channel", None)
            if ac and getattr(ac, "form_url", None) and getattr(ac.form_url, "value", None):
                target_website = ac.form_url.value
            else:
                extracted_urls = extract_urls_from_text(opportunity_text or "")
                if extracted_urls:
                    target_website = extracted_urls[0]

        website_report = None
        if target_website:
            try:
                website_report = inspect_domain(target_website, claimed_company=extracted_company)
            except Exception as err:
                logger.warning(f"Website domain inspection error: {err}")

        # 6. Risk Engine
        try:
            risk_report = evaluate_risk(
                extraction_schema,
                email_report=email_report,
                website_report=website_report,
                corporate_report=corporate_report
            )
        except Exception as e:
            logger.error(f"Risk Engine failure: {str(e)}")
            raise APIException("ANALYSIS_FAILED", "The risk evaluation engine failed to process the extracted facts.", status_code=500)
            
        # 7. Build API Response
        
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
            
        email_verif_payload = None
        if email_report:
            email_verif_payload = EmailVerificationDetails(
                email=email_report.email,
                domain=email_report.domain,
                is_free_webmail=email_report.is_free_webmail,
                has_mx_records=email_report.has_mx_records,
                status=email_report.status,
                brand_impersonation_detected=email_report.brand_impersonation_detected,
                impersonated_brand=email_report.impersonated_brand,
                expected_domain=email_report.expected_domain,
                details=email_report.details
            )

        website_verif_payload = None
        if website_report:
            website_verif_payload = WebsiteInspectionDetails(
                url=website_report.url,
                domain=website_report.domain,
                domain_age_days=website_report.domain_age_days,
                creation_date=website_report.creation_date,
                registrar=website_report.registrar,
                status=website_report.status,
                is_new_domain=website_report.is_new_domain,
                is_typosquatting=website_report.is_typosquatting,
                matched_brand=website_report.matched_brand,
                details=website_report.details,
                recommendations=website_report.recommendations
            )

        corp_verif_payload = None
        if corporate_report and corporate_report.get("status") not in ["NOT_APPLICABLE", "UNSPECIFIED_NEUTRAL"]:
            corp_verif_payload = CorporateVerificationDetails(
                company_name=corporate_report.get("company_name") or extracted_company,
                status=corporate_report.get("status", "UNSPECIFIED_NEUTRAL"),
                verified=bool(corporate_report.get("verified", False)),
                cin=corporate_report.get("cin"),
                entity_type=corporate_report.get("entity_type"),
                mca_status=corporate_report.get("mca_status"),
                platforms_detected=corporate_report.get("platforms_detected", []),
                has_own_website=bool(corporate_report.get("has_own_website", False)),
                website_url=corporate_report.get("website_url"),
                details=corporate_report.get("details", "")
            )

        verif = VerificationInformation(
            company=extracted_company if extracted_company != "UNKNOWN" else None,
            website=target_website or found_website or (corporate_report.get("website_url") if corporate_report and corporate_report.get("has_own_website") else None),
            email=target_email or (contact.recruiter_email.value if contact.recruiter_email and hasattr(contact.recruiter_email, "value") else None),
            social_links=contact.social_media_urls,
            domain_verification_available=bool(email_verif_payload or website_verif_payload or corp_verif_payload),
            corporate_verification=corp_verif_payload,
            email_verification=email_verif_payload,
            website_inspection=website_verif_payload
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
        
        response_model = AnalysisResponse(
            analysis_metadata=metadata,
            risk_indicator=indicator,
            opportunity_summary=summary,
            extracted_facts=facts,
            triggered_risk_signals=api_signals,
            safe_signals=api_safe_signals,
            recommended_actions=recommended_actions,
            verification_information=verif,
            missing_information=MissingInformation(fields=missing, prompt=missing_prompt),
            extracted_text=extracted_from_image
        )
        
        db = SessionLocal()
        try:
            existing = db.query(AnalysisCache).filter(AnalysisCache.input_hash == input_hash).first()
            if not existing:
                new_cache = AnalysisCache(
                    input_hash=input_hash,
                    response_payload=response_model.model_dump_json()
                )
                db.add(new_cache)
                db.commit()
        except Exception as e:
            logger.warning(f"Failed to cache analysis: {e}")
        finally:
            db.close()
            
        return response_model

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
