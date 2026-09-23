import re
import logging
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
import dns.resolver

logger = logging.getLogger(__name__)

FREE_WEBMAIL_DOMAINS = {
    "gmail.com", "googlemail.com", "yahoo.com", "ymail.com", "rocketmail.com",
    "outlook.com", "hotmail.com", "live.com", "msn.com",
    "icloud.com", "me.com", "mac.com",
    "proton.me", "protonmail.com", "tutanota.com", "tutamail.com",
    "zoho.com", "aol.com", "mail.com", "gmx.com", "yandex.com",
    "rediffmail.com", "inbox.com"
}

DISPOSABLE_MAIL_DOMAINS = {
    "mailinator.com", "tempmail.com", "guerrillamail.com", "10minutemail.com",
    "throwawaymail.com", "temp-mail.org", "fakeinbox.com", "trashmail.com",
    "sharklasers.com", "guerrillamailblock.com", "getairmail.com"
}

# Major enterprise brands commonly impersonated by scammers
MAJOR_BRANDS: Dict[str, str] = {
    "google": "google.com",
    "microsoft": "microsoft.com",
    "amazon": "amazon.com",
    "apple": "apple.com",
    "meta": "meta.com",
    "facebook": "meta.com",
    "netflix": "netflix.com",
    "tcs": "tcs.com",
    "tata consultancy services": "tcs.com",
    "infosys": "infosys.com",
    "wipro": "wipro.com",
    "hcl": "hcltech.com",
    "hcltech": "hcltech.com",
    "cognizant": "cognizant.com",
    "deloitte": "deloitte.com",
    "accenture": "accenture.com",
    "ibm": "ibm.com",
    "oracle": "oracle.com",
    "adobe": "adobe.com",
    "salesforce": "salesforce.com",
    "intel": "intel.com",
    "cisco": "cisco.com",
    "capgemini": "capgemini.com"
}

class EmailDomainReport(BaseModel):
    email: str
    domain: str
    is_valid_syntax: bool = True
    is_free_webmail: bool = False
    is_disposable: bool = False
    has_mx_records: bool = False
    mx_hosts: List[str] = []
    status: str = "UNKNOWN"
    # Status can be: "VERIFIED_CORPORATE", "FREE_WEBMAIL", "DISPOSABLE", "INVALID_MX", "BRAND_IMPERSONATION", "STARTUP_DOMAIN"
    brand_impersonation_detected: bool = False
    impersonated_brand: Optional[str] = None
    expected_domain: Optional[str] = None
    details: str = ""

def _levenshtein_distance(s1: str, s2: str) -> int:
    """Calculates Levenshtein distance between two strings."""
    if len(s1) < len(s2):
        return _levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)
    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]

def check_dns_mx(domain: str, timeout: float = 2.0) -> tuple[bool, List[str]]:
    """
    Checks if a domain has valid DNS MX records.
    Returns (has_mx, list_of_mx_hosts).
    """
    if not domain or not re.match(r"^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", domain):
        return False, []

    resolver = dns.resolver.Resolver()
    resolver.timeout = timeout
    resolver.lifetime = timeout

    try:
        answers = resolver.resolve(domain, 'MX')
        hosts = [str(r.exchange).rstrip('.').lower() for r in answers]
        return len(hosts) > 0, hosts
    except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN, dns.resolver.Timeout, Exception) as e:
        logger.debug(f"DNS MX query for {domain} returned error: {e}")
        return False, []

def verify_email_domain(email_str: str, claimed_company: Optional[str] = None) -> EmailDomainReport:
    """
    Performs comprehensive security and alignment verification on a recruiter/sender email.
    """
    clean_email = (email_str or "").strip().lower()
    if not clean_email or "@" not in clean_email:
        return EmailDomainReport(
            email=email_str or "",
            domain="",
            is_valid_syntax=False,
            status="INVALID_SYNTAX",
            details="Invalid email address syntax."
        )

    parts = clean_email.split("@", 1)
    local_part, domain = parts[0], parts[1]

    # Check disposable
    if domain in DISPOSABLE_MAIL_DOMAINS:
        return EmailDomainReport(
            email=clean_email,
            domain=domain,
            is_free_webmail=True,
            is_disposable=True,
            has_mx_records=False,
            status="DISPOSABLE",
            details=f"The domain '{domain}' is a temporary/disposable mailbox service frequently used to mask identities."
        )

    # Check free webmail
    is_free = domain in FREE_WEBMAIL_DOMAINS

    # Check DNS MX
    has_mx, mx_hosts = check_dns_mx(domain)

    # Check Brand Impersonation / Typosquatting
    claimed_norm = (claimed_company or "").strip().lower()
    impersonation_found = False
    matched_brand = None
    expected_brand_domain = None

    # 1. If user claims to be a major MNC (e.g. Google) but uses free webmail
    for brand, official_dom in MAJOR_BRANDS.items():
        if brand in claimed_norm:
            matched_brand = brand.title()
            expected_brand_domain = official_dom
            if is_free:
                impersonation_found = True
                break
            elif domain != official_dom:
                # Check if it's a lookalike domain (e.g. google-careers.com or g00gle.com)
                base_domain = domain.split(".")[0]
                official_base = official_dom.split(".")[0]
                dist = _levenshtein_distance(base_domain, official_base)
                if dist <= 2 or brand in domain or "career" in domain or "intern" in domain or "hiring" in domain:
                    impersonation_found = True
                    break

    # Determine status & details
    if impersonation_found and matched_brand and expected_brand_domain:
        status = "BRAND_IMPERSONATION"
        details = (
            f"Brand Impersonation Warning: The sender claims affiliation with {matched_brand}, "
            f"but uses '{domain}' instead of the verified enterprise domain '{expected_brand_domain}'."
        )
    elif is_free:
        status = "FREE_WEBMAIL"
        if claimed_company and claimed_norm not in ["unknown", "not specified", "none", ""]:
            details = f"Sender uses a free public email service ({domain}) rather than an official corporate email domain for '{claimed_company}'."
        else:
            details = f"Sender uses a public free email service ({domain})."
    elif not has_mx:
        status = "INVALID_MX"
        details = f"The domain '{domain}' has no working DNS mail servers (MX records). Emails from this domain may be forged or non-deliverable."
    else:
        # Custom corporate or startup domain with valid MX
        status = "VERIFIED_CORPORATE"
        details = f"Verified corporate email domain '{domain}' with active DNS mail exchange servers."

    return EmailDomainReport(
        email=clean_email,
        domain=domain,
        is_free_webmail=is_free,
        is_disposable=False,
        has_mx_records=has_mx,
        mx_hosts=mx_hosts,
        status=status,
        brand_impersonation_detected=impersonation_found,
        impersonated_brand=matched_brand,
        expected_domain=expected_brand_domain,
        details=details
    )
