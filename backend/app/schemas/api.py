from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict

class AnalysisMetadata(BaseModel):
    analysis_id: str
    timestamp: str
    processing_time_ms: int

class RiskIndicator(BaseModel):
    score: int
    level: str
    evidence_coverage: str = "high"

class TriggeredRiskSignal(BaseModel):
    rule_id: str
    title: str
    points: int
    severity: str
    evidence_quote: Optional[str]
    explanation: str

class SafeRiskSignal(BaseModel):
    rule_id: str
    title: str
    points: int
    confidence: str = "high"
    evidence_quote: Optional[str] = None
    explanation: str

class EmailVerificationDetails(BaseModel):
    email: Optional[str] = None
    domain: Optional[str] = None
    is_free_webmail: bool = False
    has_mx_records: bool = False
    status: str = "UNKNOWN"
    brand_impersonation_detected: bool = False
    impersonated_brand: Optional[str] = None
    expected_domain: Optional[str] = None
    details: str = ""

class WebsiteInspectionDetails(BaseModel):
    url: str
    domain: str
    domain_age_days: Optional[int] = None
    creation_date: Optional[str] = None
    registrar: Optional[str] = None
    status: str = "ACTIVE_CUSTOM_DOMAIN"
    is_new_domain: bool = False
    is_typosquatting: bool = False
    matched_brand: Optional[str] = None
    details: str = ""
    recommendations: List[str] = []

class CorporateVerificationDetails(BaseModel):
    company_name: str
    status: str = "UNSPECIFIED_NEUTRAL"
    verified: bool = False
    cin: Optional[str] = None
    entity_type: Optional[str] = None
    mca_status: Optional[str] = None
    platforms_detected: List[str] = []
    has_own_website: bool = False
    website_url: Optional[str] = None
    details: str = ""

class VerificationInformation(BaseModel):
    company: Optional[str] = None
    website: Optional[str] = None
    email: Optional[str] = None
    social_links: List[str] = []
    domain_verification_available: bool = False
    corporate_verification: Optional[CorporateVerificationDetails] = None
    email_verification: Optional[EmailVerificationDetails] = None
    website_inspection: Optional[WebsiteInspectionDetails] = None

class MissingInformation(BaseModel):
    fields: List[str]
    prompt: str

class AnalysisResponse(BaseModel):
    analysis_metadata: AnalysisMetadata
    risk_indicator: RiskIndicator
    opportunity_summary: Dict[str, Any]
    extracted_facts: Dict[str, Any]
    triggered_risk_signals: List[TriggeredRiskSignal]
    safe_signals: List[SafeRiskSignal] = []
    recommended_actions: List[str]
    verification_information: VerificationInformation
    missing_information: MissingInformation
    extracted_text: Optional[str] = None
    disclaimer: str = "Evidence-based risk indicator — not proof of fraud."

class ErrorDetails(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None

class ErrorResponse(BaseModel):
    error: ErrorDetails
