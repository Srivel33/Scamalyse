from app.services.redaction_service import redact_text

def test_email_redaction():
    text = "Contact me at scammer@gmail.com for details."
    redacted = redact_text(text)
    assert "scammer@gmail.com" not in redacted
    assert "[EMAIL_REDACTED]" in redacted

def test_upi_redaction():
    text = "Send your ₹999 fee to hr.apex@okhdfcbank or 9025756641@paytm to activate."
    redacted = redact_text(text)
    assert "hr.apex@okhdfcbank" not in redacted
    assert "9025756641@paytm" not in redacted
    assert "[UPI_REDACTED]" in redacted
    assert "₹999" in redacted

def test_phone_redaction_and_spacing():
    text = "Call me at 9025756641 or email me."
    redacted = redact_text(text)
    assert "9025756641" not in redacted
    assert "[PHONE_REDACTED] or" in redacted  # Checks proper spacing preserved

    text2 = "Call +91 98765 43210 immediately."
    redacted2 = redact_text(text2)
    assert "+91 98765 43210" not in redacted2
    assert "[PHONE_REDACTED]" in redacted2

def test_bank_details_redaction():
    text = "Bank A/C: 12345678901234, IFSC: HDFC0001234 for your salary."
    redacted = redact_text(text)
    assert "12345678901234" not in redacted
    assert "HDFC0001234" not in redacted
    assert "[ACCOUNT_REDACTED]" in redacted
    assert "[IFSC_REDACTED]" in redacted

def test_card_number_redaction():
    text = "Enter debit card 4111 2222 3333 4444 for 1 rupee verification."
    redacted = redact_text(text)
    assert "4111 2222 3333 4444" not in redacted
    assert "[CARD_REDACTED]" in redacted

def test_pan_case_insensitivity():
    text = "Submit PAN ABCDE1234F or lowercase abcde1234f."
    redacted = redact_text(text)
    assert "ABCDE1234F" not in redacted
    assert "abcde1234f" not in redacted
    assert redacted.count("[ID_REDACTED]") == 2

def test_aadhaar_like_value_redaction():
    text = "Your aadhaar 1234 5678 9012 is needed."
    redacted = redact_text(text)
    assert "1234 5678 9012" not in redacted
    assert "[ID_REDACTED]" in redacted

def test_passport_redaction():
    text = "Submit Passport No: A1234567 for foreign internship."
    redacted = redact_text(text)
    assert "A1234567" not in redacted
    assert "[ID_REDACTED]" in redacted

def test_otp_and_pin_redaction():
    text = "Your OTP is 456789 do not share it. Enter pin: 1234."
    redacted = redact_text(text)
    assert "456789" not in redacted
    assert "1234" not in redacted
    assert "OTP is [OTP_REDACTED]" in redacted
    assert "pin: [OTP_REDACTED]" in redacted

def test_normal_salary_and_evidence_preservation():
    text = "You will be paid ₹150000 per month. Pay ₹999 deposit. Rate is $40/hr."
    redacted = redact_text(text)
    assert "₹150000" in redacted
    assert "₹999" in redacted
    assert "$40/hr" in redacted
    assert "[PHONE_REDACTED]" not in redacted
