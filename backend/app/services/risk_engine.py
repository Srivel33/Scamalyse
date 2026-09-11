from app.schemas.gemini import GeminiExtractionSchema
from app.models.risk import RiskReport, TriggeredRule, EvidenceQuote
from typing import List, Optional

def extract_evidence(schema_field) -> List[EvidenceQuote]:
    """Helper to safely extract evidence quotes from a schema field."""
    if not hasattr(schema_field, "evidence") or not schema_field.evidence:
        return []
    return [EvidenceQuote(quote=e.quote, source=e.source) for e in schema_field.evidence]

def evaluate_risk(schema: GeminiExtractionSchema) -> RiskReport:
    signals: List[TriggeredRule] = []
    
    # GROUP A - Direct Financial Harm (Cap 50)
    group_a_points = 0
    
    # R01
    pr = schema.payment_requests
    if pr.payment_requested.value is True and pr.payment_required_to_start.value is True:
        evidence = extract_evidence(pr.payment_required_to_start) or extract_evidence(pr.payment_requested)
        signals.append(TriggeredRule(
            rule_id="R01",
            title="Upfront payment requested",
            points=35,
            severity="HIGH",
            evidence=evidence,
            explanation="The opportunity asks you to pay a fee before starting the work or accessing the platform.",
            recommended_action="Do not pay the requested fee until the opportunity has been independently verified."
        ))
        group_a_points += 35

    # R02
    if pr.payment_method.value in ["cryptocurrency", "wallet"]:
        signals.append(TriggeredRule(
            rule_id="R02",
            title="Cryptocurrency/wallet payment required",
            points=40,
            severity="HIGH",
            evidence=extract_evidence(pr.payment_method),
            explanation="Cryptocurrency and untraceable wallet payments are largely untraceable and frequently used to avoid banking regulations.",
            recommended_action="Do not send cryptocurrency or transfer money to unlock the opportunity. Insist on standard bank transfers."
        ))
        group_a_points += 40

    # R05
    ts = schema.task_scam_indicators
    if ts.deposit_to_unlock_tasks.value is True or ts.recharge_required.value is True:
        evidence = extract_evidence(ts.deposit_to_unlock_tasks) or extract_evidence(ts.recharge_required)
        signals.append(TriggeredRule(
            rule_id="R05",
            title="User must deposit own money to work",
            points=35,
            severity="HIGH",
            evidence=evidence,
            explanation="Legitimate task platforms pay you; they do not require you to risk your own capital to work or unlock tasks.",
            recommended_action="Do not deposit your own money to unlock tasks or withdraw earnings."
        ))
        group_a_points += 35

    # R06
    fti = schema.financial_transfer_indicators
    if (fti.receive_money_request.value is True or fti.forward_money_request.value is True or 
        fti.check_deposit_request.value is True or fti.gift_card_purchase_request.value is True or 
        fti.money_transfer_request.value is True):
        
        evidence = (extract_evidence(fti.receive_money_request) or extract_evidence(fti.forward_money_request) or 
                    extract_evidence(fti.check_deposit_request) or extract_evidence(fti.gift_card_purchase_request) or
                    extract_evidence(fti.money_transfer_request))
                    
        signals.append(TriggeredRule(
            rule_id="R06",
            title="Money transfer or gift-card scheme",
            points=35,
            severity="HIGH",
            evidence=evidence,
            explanation="This pattern often indicates money laundering or a fake-check scam where the initial funds will bounce.",
            recommended_action="Do not use your personal bank account to process third-party funds or purchase gift cards."
        ))
        group_a_points += 35

    # GROUP B - Sensitive Information (Cap 40)
    group_b_points = 0
    
    # R03
    sens = schema.sensitive_information_requests
    always_suspicious = sens.OTP.value is True or sens.password.value is True or sens.financial_credentials.value is True
    other_sensitive = (sens.bank_account_details.value is True or sens.card_details.value is True or 
                       sens.Aadhaar.value is True or sens.PAN.value is True or sens.identity_document.value is True)
    
    r03_trigger = False
    evidence_r03 = []
    
    if always_suspicious:
        r03_trigger = True
        evidence_r03 = (extract_evidence(sens.OTP) or extract_evidence(sens.password) or extract_evidence(sens.financial_credentials))
    elif other_sensitive:
        # Evaluate context for premature requests
        stage = (sens.request_stage.value or "").lower()
        rp = schema.recruitment_process
        
        # Explicitly suspicious stages
        if any(k in stage for k in ["registration", "application", "initial", "start", "whatsapp", "telegram", "immediate"]):
            r03_trigger = True
        # Lack of proper recruitment process makes any request premature
        elif rp.instant_selection.value is True or rp.unexpected_contact.value is True:
            r03_trigger = True
            
        if r03_trigger:
            evidence_r03 = (extract_evidence(sens.bank_account_details) or extract_evidence(sens.Aadhaar) or 
                            extract_evidence(sens.PAN) or extract_evidence(sens.card_details) or extract_evidence(sens.identity_document))

    if r03_trigger:
        signals.append(TriggeredRule(
            rule_id="R03",
            title="Sensitive information requested prematurely",
            points=30,
            severity="HIGH",
            evidence=evidence_r03,
            explanation="Identity documents and banking credentials should only be shared through secure official HR channels after an offer is finalized.",
            recommended_action="Do not share OTPs, passwords, or financial credentials. Verify the employer before sharing ID documents."
        ))
        group_b_points += 30

    # GROUP C - Recruitment Deception (Cap 35)
    group_c_points = 0
    
    # R07
    oi = schema.organisation_identity
    if oi.company_claimed.value and oi.personal_email_used.value is True:
        signals.append(TriggeredRule(
            rule_id="R07",
            title="Personal email used for corporate claims",
            points=20,
            severity="MEDIUM",
            evidence=extract_evidence(oi.personal_email_used) or extract_evidence(oi.company_claimed),
            explanation="Official corporate representatives will almost always use their company's official email domain, not a free email provider.",
            recommended_action="Verify the recruiter through the organisation's official website."
        ))
        group_c_points += 20

    # R08
    rp = schema.recruitment_process
    if rp.unexpected_contact.value is True:
        signals.append(TriggeredRule(
            rule_id="R08",
            title="Unexpected recruiter contact",
            points=15,
            severity="MEDIUM",
            evidence=extract_evidence(rp.unexpected_contact),
            explanation="Unsolicited casual messages offering employment are a common recruitment tactic for fraudulent schemes.",
            recommended_action="Ask where they found your profile and verify their identity."
        ))
        group_c_points += 15

    # R09
    # R09 must ONLY trigger if interview_mentioned is explicitly False AND there is actual evidence supporting this claim.
    has_interview_evidence = len(rp.interview_mentioned.evidence) > 0
    if rp.instant_selection.value is True and rp.interview_mentioned.value is False and has_interview_evidence:
        signals.append(TriggeredRule(
            rule_id="R09",
            title="Instant selection / No interview",
            points=15,
            severity="MEDIUM",
            evidence=extract_evidence(rp.instant_selection) or extract_evidence(rp.interview_mentioned),
            explanation="Legitimate employment typically involves an evaluation process to ensure a mutual fit.",
            recommended_action="Treat guaranteed instant employment with skepticism, especially if combined with fees."
        ))
        group_c_points += 15

    # GROUP D - Task/Earning Patterns (Cap 40)
    group_d_points = 0
    
    # R04
    if ts.task_work.value is True and (ts.product_optimization.value is True or ts.product_boosting.value is True or 
                                       ts.rating_tasks.value is True or ts.liking_tasks.value is True or ts.clicking_tasks.value is True):
        evidence = (extract_evidence(ts.task_work) or extract_evidence(ts.product_optimization) or extract_evidence(ts.liking_tasks))
        signals.append(TriggeredRule(
            rule_id="R04",
            title="Task-scam pattern detected",
            points=30,
            severity="HIGH",
            evidence=evidence,
            explanation="Paying users directly to blindly like content or rate products is a well-known structure for task-based fraud.",
            recommended_action="Research 'task scams' and avoid participating in metric manipulation."
        ))
        group_d_points += 30
        
    # R10
    comp = schema.compensation
    if comp.guaranteed_earnings.value is True or comp.unrealistic_earning_language.value is True:
        evidence = extract_evidence(comp.guaranteed_earnings) or extract_evidence(comp.unrealistic_earning_language)
        signals.append(TriggeredRule(
            rule_id="R10",
            title="Guaranteed or unrealistic earning claims",
            points=15,
            severity="MEDIUM",
            evidence=evidence,
            explanation="Extremely high compensation for unskilled, low-effort work is often used as a lure.",
            recommended_action="Compare the offered compensation with industry standards for similar work."
        ))
        group_d_points += 15

    # GROUP E - Pressure/Urgency (Cap 20)
    group_e_points = 0
    
    # R11
    up = schema.urgency_and_pressure
    if up.urgency_present.value is True or up.threat_or_pressure.value is True or up.pressure_to_pay.value is True:
        evidence = extract_evidence(up.urgency_present) or extract_evidence(up.threat_or_pressure) or extract_evidence(up.pressure_to_pay)
        signals.append(TriggeredRule(
            rule_id="R11",
            title="Extreme urgency or pressure",
            points=10,
            severity="LOW",
            evidence=evidence,
            explanation="High-pressure tactics are designed to force you to act quickly without thinking or verifying.",
            recommended_action="Pause and verify independently rather than acting under pressure."
        ))
        group_e_points += 10

    # Calculate final score with caps
    capped_a = min(group_a_points, 50)
    capped_b = min(group_b_points, 40)
    capped_c = min(group_c_points, 35)
    capped_d = min(group_d_points, 40)
    capped_e = min(group_e_points, 20)
    
    final_score = capped_a + capped_b + capped_c + capped_d + capped_e
    final_score = min(final_score, 100)
    
    # Determine risk level
    if final_score <= 24:
        level = "LOW"
    elif final_score <= 49:
        level = "MODERATE"
    elif final_score <= 74:
        level = "HIGH"
    else:
        level = "VERY HIGH"
        
    return RiskReport(
        score=final_score,
        level=level,
        triggered_signals=signals
    )
