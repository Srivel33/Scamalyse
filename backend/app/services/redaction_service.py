import re

def redact_text(text: str) -> str:
    """
    Redacts sensitive PII from text before it is sent to the LLM.
    Important: Redaction must not destroy useful scam evidence (e.g. ₹999).
    """
    if not text:
        return text

    # 1. Email Redaction
    email_pattern = r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b"
    text = re.sub(email_pattern, "[EMAIL_REDACTED]", text)

    # 2. PAN-like Redaction (Indian Permanent Account Number: 5 letters, 4 numbers, 1 letter)
    pan_pattern = r"\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b"
    text = re.sub(pan_pattern, "[ID_REDACTED]", text)

    # 3. Aadhaar-like Redaction (12 digits, optional space/dash every 4 digits)
    aadhaar_pattern = r"(?<![₹$€£\d])\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b"
    text = re.sub(aadhaar_pattern, "[ID_REDACTED]", text)

    # 4. Phone Redaction
    # Match standard 10 digit phones with optional country code, excluding amounts.
    # Allows various spacing like 5-5 or 3-3-4.
    phone_pattern = r"(?<![₹$€£\d\w])(?:\+?\d{1,3}[\s-]?)?(?:\d[\s-]*){10}\b"
    text = re.sub(phone_pattern, "[PHONE_REDACTED]", text)

    # 5. OTP-like Redaction
    def replace_otp(match):
        return f"{match.group(1)}[OTP_REDACTED]"
    
    otp_pattern = r"(?i)(\b(?:otp|code|pin)\b.{0,15}?\b)(\d{4,8})\b"
    text = re.sub(otp_pattern, replace_otp, text)

    return text
