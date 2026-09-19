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

    # R13 - Unverified government or institutional endorsement
    ie = getattr(schema, "institutional_endorsement", None)
    if ie and ie.government_or_regulatory_collaboration_claimed.value is True and ie.official_affiliation_verified.value is not True:
        signals.append(TriggeredRule(
            rule_id="R13",
            title="Unverified government / institutional endorsement",
            points=25,
            severity="HIGH",
            evidence=extract_evidence(ie.government_or_regulatory_collaboration_claimed),
            explanation="The message claims collaboration with official institutions (e.g., AICTE, MSME) without an official government domain link (.gov.in / aicte-india.org). Regulatory bodies caution against unauthorized third-party commercial claims.",
            recommended_action="Verify the program directly on the official AICTE portal (internship.aicte-india.org) before applying."
        ))
        group_c_points += 25

    # R14 - Free public form used for corporate recruitment
    ac = getattr(schema, "application_channel", None)
    if ac and ac.public_form_used.value is True:
        signals.append(TriggeredRule(
            rule_id="R14",
            title="Application hosted on generic free form",
            points=15,
            severity="MEDIUM",
            evidence=extract_evidence(ac.public_form_used) or extract_evidence(ac.form_url),
            explanation="The offer collects candidate applications through a free public form (e.g. Google Forms or forms.gle) rather than an official corporate careers portal or verified ATS.",
            recommended_action="Do not provide sensitive identification or personal details via unverified public forms."
        ))
        group_c_points += 15

    # R15 - Vague or unnamed corporate partner claims
    if ac and ac.vague_partner_claims.value is True:
        signals.append(TriggeredRule(
            rule_id="R15",
            title="Unnamed or vague corporate partner claims",
            points=10,
            severity="LOW",
            evidence=extract_evidence(ac.vague_partner_claims),
            explanation="The message references unnamed 'MNC partners' or 'corporate hiring partners' to manufacture credibility without disclosing actual hiring companies.",
            recommended_action="Ask for the specific list of hiring partner companies and verify if they are actively recruiting through this facilitator."
        ))
        group_c_points += 10

    # GROUP D - Task/Earning & Training Patterns (Cap 40)
    group_d_points = 0
    
    # R12 - Training or course sales disguised as employment
    tdi = getattr(schema, "training_disguised_as_internship", None)
    if tdi:
        is_training = tdi.training_required_before_work.value is True
        is_admissions = tdi.admissions_team_sender.value is True
        is_coursework = tdi.coursework_prerequisite_for_placement.value is True
        if is_training or is_admissions or is_coursework:
            evidence = (extract_evidence(tdi.training_required_before_work) or
                        extract_evidence(tdi.admissions_team_sender) or
                        extract_evidence(tdi.coursework_prerequisite_for_placement))
            signals.append(TriggeredRule(
                rule_id="R12",
                title="Training/course sales disguised as internship",
                points=30,
                severity="HIGH",
                evidence=evidence,
                explanation="The opportunity labels itself an internship, but requires upfront training, is managed by an 'Admissions Team', or makes placement conditional on coursework. Real employers pay interns; EdTech training schemes use this lure to sell courses.",
                recommended_action="Confirm whether fees will be charged for training, certificates, or seat reservation. Avoid paying for job training."
            ))
            group_d_points += 30

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

    # SAFE / TRUST SIGNALS EVALUATION
    safe_signals: List[TriggeredRule] = []

    # S01: No upfront payment requested
    pr = schema.payment_requests
    if pr.payment_requested.value is False:
        safe_signals.append(TriggeredRule(
            rule_id="S01",
            title="No upfront payment requested",
            points=20,
            severity="SAFE",
            evidence=extract_evidence(pr.payment_requested),
            explanation="The offer does not demand any registration fees, security deposits, or paid materials upfront.",
            recommended_action="Maintain verification."
        ))

    # S02: Structured interview or assessment process
    rp = schema.recruitment_process
    if rp.interview_mentioned.value is True or rp.assessment_mentioned.value is True:
        evidence = extract_evidence(rp.interview_mentioned) or extract_evidence(rp.assessment_mentioned)
        safe_signals.append(TriggeredRule(
            rule_id="S02",
            title="Structured interview / assessment process",
            points=15,
            severity="SAFE",
            evidence=evidence,
            explanation="The recruitment involves a formal evaluation or interview round rather than unconditional instant hiring.",
            recommended_action="Prepare for your evaluation."
        ))

    # S03: Official corporate communication domain
    oi = schema.organisation_identity
    contact = schema.contact_information
    has_domain = bool((oi.official_domain_claimed.value and oi.official_domain_claimed.value.lower() != "unknown") or 
                      (contact.recruiter_email_domain.value and contact.recruiter_email_domain.value.lower() not in ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "unknown"]))
    if oi.personal_email_used.value is False and has_domain:
        evidence = extract_evidence(oi.personal_email_used) or extract_evidence(oi.official_domain_claimed)
        safe_signals.append(TriggeredRule(
            rule_id="S03",
            title="Official corporate communication domain",
            points=15,
            severity="SAFE",
            evidence=evidence,
            explanation="Communications originate from a dedicated corporate domain rather than a free public webmail service.",
            recommended_action="Cross-check this domain against public registry."
        ))

    # S04: Identifiable organization name provided
    opp_info = schema.opportunity_information
    comp_name = opp_info.company_name.value if opp_info.company_name and hasattr(opp_info.company_name, "value") else (opp_info.company_name or oi.company_claimed.value)
    if comp_name and str(comp_name).strip().upper() not in ["UNKNOWN", "NOT DETECTED", "NOT SPECIFIED", "NONE", ""]:
        safe_signals.append(TriggeredRule(
            rule_id="S04",
            title="Identifiable organization name provided",
            points=10,
            severity="SAFE",
            evidence=[],
            explanation=f"The opportunity clearly identifies a specific entity ('{comp_name}'), enabling independent corporate registration checks.",
            recommended_action="Verify this company independently."
        ))

    # S05: Absence of coercive threats or pressure to pay
    up = schema.urgency_and_pressure
    if up.threat_or_pressure.value is False and up.pressure_to_pay.value is False:
        safe_signals.append(TriggeredRule(
            rule_id="S05",
            title="Absence of coercive threats or financial pressure",
            points=10,
            severity="SAFE",
            evidence=[],
            explanation="No aggressive ultimatums, legal intimidation, or coercive demands to transfer funds immediately were detected.",
            recommended_action="Take normal time to verify."
        ))

    # S06: No sensitive credential or banking password requests
    sens = schema.sensitive_information_requests
    if sens.OTP.value is False and sens.password.value is False and sens.financial_credentials.value is False:
        safe_signals.append(TriggeredRule(
            rule_id="S06",
            title="No premature financial or credential requests",
            points=15,
            severity="SAFE",
            evidence=[],
            explanation="The opportunity does not solicit banking passwords, OTPs, or financial account credentials.",
            recommended_action="Keep sensitive credentials private."
        ))

    # S07: Standard professional scope
    ts = schema.task_scam_indicators
    fti = schema.financial_transfer_indicators
    if ts.task_work.value is False and fti.money_transfer_request.value is False and fti.gift_card_purchase_request.value is False:
        safe_signals.append(TriggeredRule(
            rule_id="S07",
            title="Standard professional / educational scope",
            points=10,
            severity="SAFE",
            evidence=[],
            explanation="No artificial task-boosting, video-liking tasks, gift-card forwarding, or recharge-to-earn mechanisms were detected.",
            recommended_action="Focus on validating the role requirements."
        ))

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
        triggered_signals=signals,
        safe_signals=safe_signals
    )
