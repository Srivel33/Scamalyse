from app.services.redaction_service import redact_text

def test_email_redaction():
    text = "Contact me at scammer@gmail.com for details."
    redacted = redact_text(text)
    assert "scammer@gmail.com" not in redacted
    assert "[EMAIL_REDACTED]" in redacted

def test_phone_redaction():
    text = "Call me at +91 98765 43210 immediately."
    redacted = redact_text(text)
    assert "+91 98765 43210" not in redacted
    assert "[PHONE_REDACTED]" in redacted
    
    text2 = "My number is 9876543210."
    redacted2 = redact_text(text2)
    assert "9876543210" not in redacted2
    assert "[PHONE_REDACTED]" in redacted2

def test_otp_like_value_redaction():
    text = "Your OTP is 456789 do not share it."
    redacted = redact_text(text)
    assert "456789" not in redacted
    assert "OTP is [OTP_REDACTED]" in redacted
    
    text2 = "Enter pin: 1234 to proceed."
    redacted2 = redact_text(text2)
    assert "1234" not in redacted2
    assert "pin: [OTP_REDACTED]" in redacted2

def test_pan_like_value_redaction():
    text = "Please submit your PAN ABCDE1234F."
    redacted = redact_text(text)
    assert "ABCDE1234F" not in redacted
    assert "[ID_REDACTED]" in redacted

def test_aadhaar_like_value_redaction():
    text = "Your aadhaar 1234 5678 9012 is needed."
    redacted = redact_text(text)
    assert "1234 5678 9012" not in redacted
    assert "[ID_REDACTED]" in redacted

def test_normal_salary_preservation():
    text = "You will be paid ₹150000 per month."
    redacted = redact_text(text)
    assert "₹150000" in redacted
    assert "[PHONE_REDACTED]" not in redacted
    assert "[ID_REDACTED]" not in redacted

def test_normal_payment_amount_preservation():
    text = "Pay $999 to start."
    redacted = redact_text(text)
    assert "$999" in redacted
    
    text2 = "Pay 500rs registration fee."
    redacted2 = redact_text(text2)
    assert "500rs" in redacted2

def test_useful_scam_evidence_preservation():
    text = "Pay ₹999 activation fee through USDT to start."
    redacted = redact_text(text)
    assert "Pay ₹999 activation fee through USDT to start." in redacted
