from typing import Literal, List, Optional, Union, Dict, Any
from pydantic import BaseModel, Field, field_validator

def normalize_list_input(v: Any) -> List[str]:
    if isinstance(v, dict):
        v = v.get("value", [])
    if isinstance(v, list):
        return [str(x) for x in v if x is not None]
    if isinstance(v, str) and v.strip():
        return [v.strip()]
    return []

def normalize_str_input(v: Any) -> Optional[str]:
    if isinstance(v, dict):
        val = v.get("value")
        return str(val) if val is not None else None
    return str(v) if v is not None else None

class Evidence(BaseModel):
    quote: str
    source: Literal["submitted_text"]

class EvidenceString(BaseModel):
    value: Optional[str]
    confidence: Literal["high", "medium", "low"]
    evidence: List[Evidence]

class EvidenceBoolean(BaseModel):
    value: Union[bool, Literal["unknown"]]
    confidence: Literal["high", "medium", "low"]
    evidence: List[Evidence]

class EvidencePaymentMethod(BaseModel):
    value: Literal["bank_transfer", "UPI", "cryptocurrency", "wallet", "gift_card", "cash", "unknown"]
    confidence: Literal["high", "medium", "low"]
    evidence: List[Evidence]

    @field_validator('value', mode='before')
    @classmethod
    def coerce_payment_method(cls, v: Any) -> str:
        if isinstance(v, dict):
            v = v.get("value")
        allowed = ["bank_transfer", "UPI", "cryptocurrency", "wallet", "gift_card", "cash", "unknown"]
        if v in allowed:
            return v
        if isinstance(v, str):
            vl = v.lower()
            if any(k in vl for k in ["crypto", "usdt", "btc", "bitcoin", "binance", "trc"]):
                return "cryptocurrency"
            if any(k in vl for k in ["upi", "gpay", "phonepe", "paytm"]):
                return "UPI"
            if any(k in vl for k in ["bank", "neft", "imps", "wire", "check"]):
                return "bank_transfer"
            if any(k in vl for k in ["gift", "voucher"]):
                return "gift_card"
            if any(k in vl for k in ["wallet"]):
                return "wallet"
            if any(k in vl for k in ["cash"]):
                return "cash"
        return "unknown"

class OpportunityInformation(BaseModel):
    company_name: Optional[str] = None
    role: Optional[str] = None
    opportunity_type: Literal["internship", "job", "task_work", "course", "campus_ambassador", "contest", "other", "unknown"] = "unknown"
    description: Optional[str] = None
    source_platform: Optional[str] = None

    @field_validator('company_name', 'role', 'description', 'source_platform', mode='before')
    @classmethod
    def coerce_strings(cls, v: Any) -> Optional[str]:
        return normalize_str_input(v)

    @field_validator('opportunity_type', mode='before')
    @classmethod
    def coerce_opp_type(cls, v: Any) -> str:
        if isinstance(v, dict):
            v = v.get("value")
        if isinstance(v, str):
            vl = v.strip().lower()
            allowed = ["internship", "job", "task_work", "course", "campus_ambassador", "contest", "other", "unknown"]
            if vl in allowed:
                return vl
        return "unknown"

class Compensation(BaseModel):
    salary_claim: EvidenceString
    salary_amount: EvidenceString
    salary_currency: EvidenceString
    salary_frequency: EvidenceString
    commission_claim: EvidenceBoolean
    guaranteed_earnings: EvidenceBoolean
    unrealistic_earning_language: EvidenceBoolean

class PaymentRequests(BaseModel):
    payment_requested: EvidenceBoolean
    payment_amount: EvidenceString
    payment_currency: EvidenceString
    payment_reason: EvidenceString
    payment_method: EvidencePaymentMethod
    payment_required_to_start: EvidenceBoolean
    payment_required_to_continue: EvidenceBoolean
    payment_required_to_withdraw: EvidenceBoolean

class TaskScamIndicators(BaseModel):
    task_work: EvidenceBoolean
    product_optimization: EvidenceBoolean
    product_boosting: EvidenceBoolean
    rating_tasks: EvidenceBoolean
    liking_tasks: EvidenceBoolean
    clicking_tasks: EvidenceBoolean
    commission_per_task: EvidenceBoolean
    deposit_to_unlock_tasks: EvidenceBoolean
    recharge_required: EvidenceBoolean
    negative_balance_claim: EvidenceBoolean

class FinancialTransferIndicators(BaseModel):
    check_deposit_request: EvidenceBoolean
    receive_money_request: EvidenceBoolean
    forward_money_request: EvidenceBoolean
    gift_card_purchase_request: EvidenceBoolean
    money_transfer_request: EvidenceBoolean

class RecruitmentProcess(BaseModel):
    unexpected_contact: EvidenceBoolean
    instant_selection: EvidenceBoolean
    interview_mentioned: EvidenceBoolean
    application_mentioned: EvidenceBoolean
    assessment_mentioned: EvidenceBoolean
    hiring_process_description: EvidenceString

class ContactInformation(BaseModel):
    recruiter_name: EvidenceString
    recruiter_email: EvidenceString
    recruiter_email_domain: EvidenceString
    phone_number_present: EvidenceBoolean
    website_urls: List[str] = Field(default_factory=list)
    social_media_urls: List[str] = Field(default_factory=list)
    contact_method: EvidenceString

    @field_validator('website_urls', 'social_media_urls', mode='before')
    @classmethod
    def coerce_urls(cls, v: Any) -> List[str]:
        return normalize_list_input(v)

class OrganisationIdentity(BaseModel):
    company_claimed: EvidenceString
    official_domain_claimed: EvidenceString
    personal_email_used: EvidenceBoolean
    company_identity_evidence: EvidenceString

class SensitiveInformationRequests(BaseModel):
    OTP: EvidenceBoolean
    password: EvidenceBoolean
    bank_account_details: EvidenceBoolean
    card_details: EvidenceBoolean
    Aadhaar: EvidenceBoolean
    PAN: EvidenceBoolean
    identity_document: EvidenceBoolean
    financial_credentials: EvidenceBoolean
    requested_information: List[str] = Field(default_factory=list)
    reason_given: EvidenceString
    request_stage: EvidenceString

    @field_validator('requested_information', mode='before')
    @classmethod
    def coerce_req_info(cls, v: Any) -> List[str]:
        return normalize_list_input(v)

class UrgencyAndPressure(BaseModel):
    urgency_present: EvidenceBoolean
    urgency_phrases: List[str] = Field(default_factory=list)
    deadline_claim: EvidenceString
    threat_or_pressure: EvidenceBoolean
    pressure_to_pay: EvidenceBoolean
    pressure_to_share_information: EvidenceBoolean

    @field_validator('urgency_phrases', mode='before')
    @classmethod
    def coerce_urgency(cls, v: Any) -> List[str]:
        return normalize_list_input(v)

class TrainingDisguisedAsInternship(BaseModel):
    training_required_before_work: EvidenceBoolean = Field(
        default_factory=lambda: EvidenceBoolean(value="unknown", confidence="low", evidence=[])
    )
    admissions_team_sender: EvidenceBoolean = Field(
        default_factory=lambda: EvidenceBoolean(value="unknown", confidence="low", evidence=[])
    )
    coursework_prerequisite_for_placement: EvidenceBoolean = Field(
        default_factory=lambda: EvidenceBoolean(value="unknown", confidence="low", evidence=[])
    )

class InstitutionalEndorsement(BaseModel):
    government_or_regulatory_collaboration_claimed: EvidenceBoolean = Field(
        default_factory=lambda: EvidenceBoolean(value="unknown", confidence="low", evidence=[])
    )
    institution_names: List[str] = Field(default_factory=list)
    official_affiliation_verified: EvidenceBoolean = Field(
        default_factory=lambda: EvidenceBoolean(value="unknown", confidence="low", evidence=[])
    )

    @field_validator('institution_names', mode='before')
    @classmethod
    def coerce_institutions(cls, v: Any) -> List[str]:
        return normalize_list_input(v)

class ApplicationChannel(BaseModel):
    public_form_used: EvidenceBoolean = Field(
        default_factory=lambda: EvidenceBoolean(value="unknown", confidence="low", evidence=[])
    )
    form_url: EvidenceString = Field(
        default_factory=lambda: EvidenceString(value=None, confidence="low", evidence=[])
    )
    vague_partner_claims: EvidenceBoolean = Field(
        default_factory=lambda: EvidenceBoolean(value="unknown", confidence="low", evidence=[])
    )

class WebsiteContentAnalysis(BaseModel):
    content_matches_claimed_company: EvidenceBoolean = Field(
        default_factory=lambda: EvidenceBoolean(value="unknown", confidence="low", evidence=[])
    )
    brand_impersonation_detected: EvidenceBoolean = Field(
        default_factory=lambda: EvidenceBoolean(value="unknown", confidence="low", evidence=[])
    )
    suspicious_scraped_content: EvidenceBoolean = Field(
        default_factory=lambda: EvidenceBoolean(value="unknown", confidence="low", evidence=[])
    )
    scraped_company_name: EvidenceString = Field(
        default_factory=lambda: EvidenceString(value=None, confidence="low", evidence=[])
    )

class GeminiExtractionSchema(BaseModel):
    opportunity_information: OpportunityInformation
    compensation: Compensation
    payment_requests: PaymentRequests
    task_scam_indicators: TaskScamIndicators
    financial_transfer_indicators: FinancialTransferIndicators
    recruitment_process: RecruitmentProcess
    contact_information: ContactInformation
    organisation_identity: OrganisationIdentity
    sensitive_information_requests: SensitiveInformationRequests
    urgency_and_pressure: UrgencyAndPressure
    training_disguised_as_internship: Optional[TrainingDisguisedAsInternship] = Field(
        default_factory=TrainingDisguisedAsInternship
    )
    institutional_endorsement: Optional[InstitutionalEndorsement] = Field(
        default_factory=InstitutionalEndorsement
    )
    application_channel: Optional[ApplicationChannel] = Field(
        default_factory=ApplicationChannel
    )
    website_content_analysis: Optional[WebsiteContentAnalysis] = Field(
        default_factory=WebsiteContentAnalysis
    )

