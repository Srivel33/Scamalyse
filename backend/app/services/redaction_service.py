import re

def redact_text(text: str) -> str:
    """
    Redacts sensitive PII from text before it is sent to the LLM or stored in cache.
    Bulletproof multi-format scrubbing:
    1. Email Addresses
    2. UPI IDs / VPA payment handles (GPay, PhonePe, Paytm, etc.)
    3. Credit & Debit Card numbers (16 digits)
    4. Bank Account numbers (with A/C prefix)
    5. IFSC Codes
    6. Indian PAN Cards (uppercase & lowercase)
    7. Aadhaar Numbers (12 digits, spaced or contiguous)
    8. Passport Numbers
    9. Mobile & Phone Numbers (with currency lookaround, no trailing space swallowed)
    10. OTPs, PINs & Passwords
    
    CRITICAL: Preserves all monetary scam evidence (e.g. ₹999, $40, 500rs, ₹150000).
    """
    if not text:
        return text

    # 1. Email Redaction (RFC format requiring domain dot e.g. .com, .in, .org)
    email_pattern = r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,7}\b"
    text = re.sub(email_pattern, "[EMAIL_REDACTED]", text)

    # 2. UPI ID / VPA Redaction (e.g. user@okhdfcbank, 9025575864@paytm, hr@ybl, payment@upi)
    # Excludes standard emails because emails were already sanitized above.
    upi_pattern = r"\b[A-Za-z0-9._%+-]{2,35}@[A-Za-z0-9_-]{2,25}\b"
    text = re.sub(upi_pattern, "[UPI_REDACTED]", text)

    # 3. Credit / Debit Card (16 digits in blocks of 4 or contiguous)
    card_pattern = r"(?<![₹$€£\d])\b(?:\d{4}[\s-]?){3}\d{4}\b"
    text = re.sub(card_pattern, "[CARD_REDACTED]", text)

    # 4. Bank Account Number (Preceded by a/c, account, acc no, bank a/c)
    bank_acc_pattern = r"(?i)(\b(?:a\/c|account(?:\s*no)?|acc(?:\s*no)?|bank(?:\s*a\/c)?)\b[\s:.-]{0,10})(\d{9,18})\b"
    text = re.sub(bank_acc_pattern, r"\g<1>[ACCOUNT_REDACTED]", text)

    # 5. IFSC Code (4 letters + 0 + 6 alphanumeric e.g. HDFC0001234, SBIN0000456)
    ifsc_pattern = r"(?i)\b[A-Z]{4}0[A-Z0-9]{6}\b"
    text = re.sub(ifsc_pattern, "[IFSC_REDACTED]", text)

    # 6. PAN Card Redaction (Case-insensitive: 5 letters, 4 numbers, 1 letter)
    pan_pattern = r"(?i)\b[A-Z]{5}[0-9]{4}[A-Z]\b"
    text = re.sub(pan_pattern, "[ID_REDACTED]", text)

    # 7. Aadhaar Redaction (12 digits, spaced or hyphenated: 1234 5678 9012 or 123456789012)
    aadhaar_pattern = r"(?<![₹$€£\d])\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b"
    text = re.sub(aadhaar_pattern, "[ID_REDACTED]", text)

    # 8. Passport Number (e.g. Passport No: A1234567 or standard series)
    passport_kw_pattern = r"(?i)(\b(?:passport(?:\s*no|\s*number)?)\b[\s:.-]{0,10})([A-PR-WYa-pr-wy][1-9]\d{6})\b"
    text = re.sub(passport_kw_pattern, r"\g<1>[ID_REDACTED]", text)

    # 9. Phone Number Redaction (Preserves trailing space, excludes currency amounts)
    phone_pattern = r"(?<![₹$€£\d\w])(?:\+?\d{1,3}[\s-]?)?(?:\d[\s-]*){9}\d\b"
    text = re.sub(phone_pattern, "[PHONE_REDACTED]", text)

    # 10. OTP / PIN Redaction (Preserves prefix keyword)
    def replace_otp(match):
        return f"{match.group(1)}[OTP_REDACTED]"
    
    otp_pattern = r"(?i)(\b(?:otp|code|pin|password|pwd)\b.{0,15}?\b)(\d{4,8})\b"
    text = re.sub(otp_pattern, replace_otp, text)

    return text
