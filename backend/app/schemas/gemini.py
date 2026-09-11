from typing import Literal, List, Optional, Union
from pydantic import BaseModel, Field

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

class OpportunityInformation(BaseModel):
    company_name: Optional[str] = None
    role: Optional[str] = None
    opportunity_type: Literal["internship", "job", "task_work", "course", "campus_ambassador", "contest", "other", "unknown"]
    description: Optional[str] = None
    source_platform: Optional[str] = None

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
    website_urls: List[str]
    social_media_urls: List[str]
    contact_method: EvidenceString

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
    requested_information: List[str]
    reason_given: EvidenceString
    request_stage: EvidenceString

class UrgencyAndPressure(BaseModel):
    urgency_present: EvidenceBoolean
    urgency_phrases: List[str]
    deadline_claim: EvidenceString
    threat_or_pressure: EvidenceBoolean
    pressure_to_pay: EvidenceBoolean
    pressure_to_share_information: EvidenceBoolean

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
