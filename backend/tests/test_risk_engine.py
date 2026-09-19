import pytest
from app.schemas.gemini import GeminiExtractionSchema
from app.services.risk_engine import evaluate_risk
from tests.test_gemini import VALID_MOCK_RESPONSE
import copy

def get_base_schema():
    return GeminiExtractionSchema(**VALID_MOCK_RESPONSE)

def test_normal_internship():
    # 1. Normal internship -> 0 / LOW
    schema = get_base_schema()
    schema.opportunity_information.opportunity_type = "internship"
    report = evaluate_risk(schema)
    assert report.score == 0
    assert report.level == "LOW"
    assert len(report.triggered_signals) == 0

def test_upfront_fee():
    # 2. ₹999 registration fee -> R01 / 35 / MODERATE
    schema = get_base_schema()
    schema.payment_requests.payment_requested.value = True
    schema.payment_requests.payment_required_to_start.value = True
    report = evaluate_risk(schema)
    assert report.score == 35
    assert report.level == "MODERATE"
    assert any(s.rule_id == "R01" for s in report.triggered_signals)

def test_crypto_payment():
    # 3. Crypto payment -> R02
    schema = get_base_schema()
    schema.payment_requests.payment_method.value = "cryptocurrency"
    report = evaluate_risk(schema)
    assert any(s.rule_id == "R02" for s in report.triggered_signals)

def test_task_optimisation():
    # 4. Task optimisation -> R04
    schema = get_base_schema()
    schema.task_scam_indicators.task_work.value = True
    schema.task_scam_indicators.product_optimization.value = True
    report = evaluate_risk(schema)
    assert any(s.rule_id == "R04" for s in report.triggered_signals)

def test_deposit_recharge():
    # 5. Deposit/recharge task -> R05
    schema = get_base_schema()
    schema.task_scam_indicators.deposit_to_unlock_tasks.value = True
    report = evaluate_risk(schema)
    assert any(s.rule_id == "R05" for s in report.triggered_signals)

def test_personal_gmail_claimed_company():
    # 6. Personal Gmail + claimed company -> R07
    schema = get_base_schema()
    schema.organisation_identity.company_claimed.value = "Google"
    schema.organisation_identity.personal_email_used.value = True
    report = evaluate_risk(schema)
    assert any(s.rule_id == "R07" for s in report.triggered_signals)

def test_instant_selection_without_no_interview_evidence():
    # Test C: Instant selection + interview_mentioned=UNKNOWN -> R09 does NOT trigger
    schema = get_base_schema()
    schema.recruitment_process.instant_selection.value = True
    schema.recruitment_process.interview_mentioned.value = "unknown"
    report = evaluate_risk(schema)
    assert not any(s.rule_id == "R09" for s in report.triggered_signals)

def test_instant_selection_with_explicit_evidence():
    # Test A: instant_selection=True, interview_mentioned=False, evidence contains explicit quote
    schema = get_base_schema()
    schema.recruitment_process.instant_selection.value = True
    schema.recruitment_process.interview_mentioned.value = False
    
    # We must mock an actual Evidence object
    from app.schemas.gemini import Evidence
    schema.recruitment_process.interview_mentioned.evidence = [
        Evidence(quote="No interview is required.", source="submitted_text")
    ]
    
    report = evaluate_risk(schema)
    assert any(s.rule_id == "R09" for s in report.triggered_signals)

def test_instant_selection_false_but_no_evidence():
    # Test B: instant_selection=True, interview_mentioned=False, evidence=[] -> R09 does NOT trigger
    schema = get_base_schema()
    schema.recruitment_process.instant_selection.value = True
    schema.recruitment_process.interview_mentioned.value = False
    schema.recruitment_process.interview_mentioned.evidence = []
    
    report = evaluate_risk(schema)
    assert not any(s.rule_id == "R09" for s in report.triggered_signals)

def test_no_instant_selection_no_interview():
    # Test D: instant_selection=False, interview_mentioned=False -> R09 does NOT trigger
    schema = get_base_schema()
    schema.recruitment_process.instant_selection.value = False
    schema.recruitment_process.interview_mentioned.value = False
    
    from app.schemas.gemini import Evidence
    schema.recruitment_process.interview_mentioned.evidence = [
        Evidence(quote="No interview is required.", source="submitted_text")
    ]
    
    report = evaluate_risk(schema)
    assert not any(s.rule_id == "R09" for s in report.triggered_signals)

def test_sensitive_info_normal_onboarding():
    # 9. Sensitive information requested during normal post-hiring onboarding -> R03 must NOT automatically trigger
    schema = get_base_schema()
    schema.sensitive_information_requests.PAN.value = True
    schema.sensitive_information_requests.request_stage.value = "post-hiring onboarding"
    report = evaluate_risk(schema)
    assert not any(s.rule_id == "R03" for s in report.triggered_signals)

def test_sensitive_info_premature():
    # 10. Sensitive information requested prematurely -> R03 triggers
    schema = get_base_schema()
    schema.sensitive_information_requests.PAN.value = True
    schema.sensitive_information_requests.request_stage.value = "whatsapp registration"
    report = evaluate_risk(schema)
    assert any(s.rule_id == "R03" for s in report.triggered_signals)

def test_whatsapp_alone():
    # 11. WhatsApp alone -> 0 additional points
    schema = get_base_schema()
    schema.contact_information.contact_method.value = "whatsapp"
    report = evaluate_risk(schema)
    assert report.score == 0

def test_telegram_alone():
    # 12. Telegram alone -> 0 additional points
    schema = get_base_schema()
    schema.contact_information.contact_method.value = "telegram"
    report = evaluate_risk(schema)
    assert report.score == 0

def test_high_salary_alone():
    # 13. High salary alone -> 0 additional points
    schema = get_base_schema()
    schema.compensation.salary_amount.value = "₹10,00,000/month"
    report = evaluate_risk(schema)
    assert report.score == 0
    assert not any(s.rule_id == "R10" for s in report.triggered_signals)

def test_urgency_alone():
    # 14. Urgency alone -> R11
    schema = get_base_schema()
    schema.urgency_and_pressure.urgency_present.value = True
    report = evaluate_risk(schema)
    assert any(s.rule_id == "R11" for s in report.triggered_signals)
    assert report.score == 10

def test_multiple_signals_group_caps():
    # 15. Multiple signals - verify group caps
    # Group A: R01 (35), R02 (40), R05 (35) => 110. Should cap at 50.
    schema = get_base_schema()
    schema.payment_requests.payment_requested.value = True
    schema.payment_requests.payment_required_to_start.value = True
    schema.payment_requests.payment_method.value = "cryptocurrency"
    schema.task_scam_indicators.deposit_to_unlock_tasks.value = True
    
    report = evaluate_risk(schema)
    # The triggered signals should include R01, R02, R05
    assert len(report.triggered_signals) == 3
    # Score should just be 50 for Group A
    assert report.score == 50

def test_maximum_possible_score():
    # 16. Maximum possible score -> never exceeds 100
    schema = get_base_schema()
    
    # Trigger everything!
    # Group A: 110 -> 50
    schema.payment_requests.payment_requested.value = True
    schema.payment_requests.payment_required_to_start.value = True
    schema.payment_requests.payment_method.value = "cryptocurrency"
    schema.task_scam_indicators.deposit_to_unlock_tasks.value = True
    
    # Group B: 30 -> 30
    schema.sensitive_information_requests.OTP.value = True
    
    # Group C: R07 (20) + R08 (15) + R09 (15) = 50 -> 35
    schema.organisation_identity.company_claimed.value = "Amazon"
    schema.organisation_identity.personal_email_used.value = True
    schema.recruitment_process.unexpected_contact.value = True
    schema.recruitment_process.instant_selection.value = True
    schema.recruitment_process.interview_mentioned.value = False
    
    # Group D: R04 (30) + R10 (15) = 45 -> 40
    schema.task_scam_indicators.task_work.value = True
    schema.task_scam_indicators.product_optimization.value = True
    schema.compensation.guaranteed_earnings.value = True
    
    # Group E: R11 (10) -> 10
    schema.urgency_and_pressure.urgency_present.value = True
    
    # Total pre-cap: 50 + 30 + 35 + 40 + 10 = 165
    report = evaluate_risk(schema)
    assert report.score == 100
    assert report.level == "VERY HIGH"

def test_unknown_values():
    # 17. UNKNOWN values do not trigger rules requiring explicit evidence
    schema = get_base_schema()
    schema.payment_requests.payment_requested.value = "unknown"
    schema.payment_requests.payment_required_to_start.value = "unknown"
    schema.payment_requests.payment_method.value = "unknown"
    schema.sensitive_information_requests.OTP.value = "unknown"
    schema.task_scam_indicators.task_work.value = "unknown"
    schema.recruitment_process.unexpected_contact.value = "unknown"
    schema.compensation.guaranteed_earnings.value = "unknown"
    schema.urgency_and_pressure.urgency_present.value = "unknown"
    
    report = evaluate_risk(schema)
    assert report.score == 0
    assert len(report.triggered_signals) == 0

def test_training_disguised_as_internship_r12():
    # 18. Training disguised as internship -> R12 (30 pts, HIGH)
    schema = get_base_schema()
    schema.training_disguised_as_internship.training_required_before_work.value = True
    report = evaluate_risk(schema)
    assert any(s.rule_id == "R12" for s in report.triggered_signals)
    assert report.score == 30
    assert report.level == "MODERATE"

def test_unverified_government_collaboration_r13():
    # 19. Unverified AICTE/Govt claim -> R13 (25 pts, HIGH)
    schema = get_base_schema()
    schema.institutional_endorsement.government_or_regulatory_collaboration_claimed.value = True
    schema.institutional_endorsement.official_affiliation_verified.value = False
    report = evaluate_risk(schema)
    assert any(s.rule_id == "R13" for s in report.triggered_signals)
    assert report.score == 25
    assert report.level == "MODERATE"

def test_public_form_and_vague_partner_r14_r15():
    # 20. Google Form (R14) + Vague partners (R15)
    schema = get_base_schema()
    schema.application_channel.public_form_used.value = True
    schema.application_channel.vague_partner_claims.value = True
    report = evaluate_risk(schema)
    assert any(s.rule_id == "R14" for s in report.triggered_signals)
    assert any(s.rule_id == "R15" for s in report.triggered_signals)
    assert report.score == 25  # 15 + 10 in Group C

def test_student_training_scam_email_composite():
    # 21. Real-world training-cum-internship scam email scenario:
    # Unexpected contact (R08: 15) + Unverified AICTE (R13: 25) + Google Form (R14: 15) -> Group C capped at 35
    # Training disguised as internship (R12: 30) -> Group D: 30
    # Limited seats urgency (R11: 10) -> Group E: 10
    # Total score: 35 + 30 + 10 = 75 (VERY HIGH)
    schema = get_base_schema()
    schema.recruitment_process.unexpected_contact.value = True
    schema.institutional_endorsement.government_or_regulatory_collaboration_claimed.value = True
    schema.institutional_endorsement.official_affiliation_verified.value = False
    schema.application_channel.public_form_used.value = True
    schema.training_disguised_as_internship.training_required_before_work.value = True
    schema.urgency_and_pressure.urgency_present.value = True
    
    report = evaluate_risk(schema)
    assert report.score == 75
    assert report.level == "VERY HIGH"
    rule_ids = [s.rule_id for s in report.triggered_signals]
    assert "R08" in rule_ids
    assert "R13" in rule_ids
    assert "R14" in rule_ids
    assert "R12" in rule_ids
    assert "R11" in rule_ids

def test_safe_signals_evaluation():
    schema = get_base_schema()
    schema.opportunity_information.company_name = "Acme Corp"
    schema.payment_requests.payment_requested.value = False
    schema.recruitment_process.interview_mentioned.value = True
    schema.urgency_and_pressure.threat_or_pressure.value = False
    schema.urgency_and_pressure.pressure_to_pay.value = False
    schema.sensitive_information_requests.OTP.value = False
    schema.sensitive_information_requests.password.value = False
    schema.sensitive_information_requests.financial_credentials.value = False
    
    report = evaluate_risk(schema)
    assert len(report.safe_signals) > 0
    safe_ids = [s.rule_id for s in report.safe_signals]
    assert "S01" in safe_ids  # No upfront fee
    assert "S02" in safe_ids  # Structured interview
    assert "S04" in safe_ids  # Identifiable company
    assert "S05" in safe_ids  # Absence of threat/pressure
