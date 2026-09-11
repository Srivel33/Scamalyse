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

class VerificationInformation(BaseModel):
    company: Optional[str] = None
    website: Optional[str] = None
    email: Optional[str] = None
    social_links: List[str] = []
    domain_verification_available: bool = False

class MissingInformation(BaseModel):
    fields: List[str]
    prompt: str

class AnalysisResponse(BaseModel):
    analysis_metadata: AnalysisMetadata
    risk_indicator: RiskIndicator
    opportunity_summary: Dict[str, Any]
    extracted_facts: Dict[str, Any]
    triggered_risk_signals: List[TriggeredRiskSignal]
    recommended_actions: List[str]
    verification_information: VerificationInformation
    missing_information: MissingInformation
    disclaimer: str = "Evidence-based risk indicator — not proof of fraud."

class ErrorDetails(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None

class ErrorResponse(BaseModel):
    error: ErrorDetails
