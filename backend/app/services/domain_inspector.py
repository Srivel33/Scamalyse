import re
import datetime
from typing import Optional, List, Tuple
from dataclasses import dataclass
from urllib.parse import urlparse

try:
    import whois
except ImportError:
    whois = None

# Known Enterprise Brands for typosquatting / brand impersonation detection
MAJOR_BRANDS = {
    "google": "google.com",
    "microsoft": "microsoft.com",
    "amazon": "amazon.com",
    "apple": "apple.com",
    "meta": "meta.com",
    "facebook": "meta.com",
    "netflix": "netflix.com",
    "tcs": "tcs.com",
    "infosys": "infosys.com",
    "wipro": "wipro.com",
    "hcl": "hcltech.com",
    "cognizant": "cognizant.com",
    "ibm": "ibm.com",
    "zoho": "zoho.com",
    "accenture": "accenture.com",
    "deloitte": "deloitte.com",
    "capgemini": "capgemini.com",
}

# High-abuse TLDs frequently used for throwaway phishing sites
HIGH_ABUSE_TLDS = {
    "xyz", "top", "tk", "ml", "ga", "cf", "gq", "click", "buzz", "club",
    "work", "icu", "site", "space", "online", "loan", "men", "stream",
}

# Free hosting subdomains commonly abused to mimic official landing pages
FREE_HOSTING_PROVIDERS = [
    "firebaseapp.com",
    "web.app",
    "render.com",
    "vercel.app",
    "netlify.app",
    "github.io",
    "glitch.me",
    "pages.dev",
    "sites.google.com",
    "forms.gle",
    "docs.google.com",
]

# Regex pattern for extracting URLs from raw text
URL_REGEX = re.compile(
    r'(?:https?:\/\/)?'  # optional scheme
    r'(?:www\.)?'         # optional www.
    r'([a-zA-Z0-9][-a-zA-Z0-9]*(?:\.[a-zA-Z0-9][-a-zA-Z0-9]*)+)' # domain.tld
    r'(?::\d+)?'          # optional port
    r'(?:[/?#]\S*)?',     # optional path/query/fragment
    re.IGNORECASE
)


@dataclass
class DomainInspectionReport:
    url: str
    domain: str
    domain_age_days: Optional[int]
    creation_date: Optional[str]
    registrar: Optional[str]
    status: str  # "VERIFIED_ENTERPRISE", "SAFE_ESTABLISHED", "STARTUP_DOMAIN", "BRAND_IMPERSONATION", "NEW_DOMAIN_WARNING", "SUSPICIOUS_HOSTING", "UNRESOLVED"
    is_new_domain: bool
    is_typosquatting: bool
    matched_brand: Optional[str]
    details: str
    recommendations: List[str]


def _levenshtein_distance(s1: str, s2: str) -> int:
    """Calculates Levenshtein edit distance between two strings."""
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


def extract_urls_from_text(text: str) -> List[str]:
    """Finds all URLs and domain-like references inside raw text."""
    if not text:
        return []
    matches = []
    for match in URL_REGEX.finditer(text):
        full_match = match.group(0).strip().rstrip(".,;!?)")
        # Ignore plain email addresses like user@domain.com
        if "@" in full_match:
            continue
        # Ensure it has a recognized top-level extension
        if "." in full_match and len(full_match.split(".")[-1]) >= 2:
            matches.append(full_match)
    return matches


def normalize_domain(url_or_domain: str) -> Tuple[str, str]:
    """
    Normalizes a URL or raw domain into (clean_url, clean_domain).
    Removes protocols, ports, trailing slashes, and 'www.'.
    """
    clean_input = url_or_domain.strip().lower()
    if not clean_input.startswith("http://") and not clean_input.startswith("https://"):
        parsed = urlparse(f"https://{clean_input}")
    else:
        parsed = urlparse(clean_input)

    netloc = parsed.netloc or parsed.path.split("/")[0]
    if ":" in netloc:
        netloc = netloc.split(":")[0]

    if netloc.startswith("www."):
        clean_domain = netloc[4:]
    else:
        clean_domain = netloc

    clean_url = clean_input if clean_input.startswith("http") else f"https://{clean_input}"
    return clean_url, clean_domain


def query_whois_metadata(domain: str) -> Tuple[Optional[int], Optional[str], Optional[str]]:
    """
    Queries WHOIS data for creation date, age in days, and registrar.
    Handles multi-date responses and connection errors gracefully.
    """
    if not whois:
        return None, None, None

    try:
        w = whois.whois(domain)
        creation = w.creation_date

        if isinstance(creation, list):
            creation = creation[0]

        registrar = w.registrar
        if isinstance(registrar, list):
            registrar = registrar[0]

        domain_age_days = None
        creation_str = None

        if isinstance(creation, datetime.datetime):
            # Normalize timezone if present
            now = datetime.datetime.now(creation.tzinfo) if creation.tzinfo else datetime.datetime.now()
            domain_age_days = max(0, (now - creation).days)
            creation_str = creation.strftime("%Y-%m-%d")
        elif isinstance(creation, str):
            creation_str = creation

        return domain_age_days, creation_str, str(registrar) if registrar else None
    except Exception:
        # WHOIS lookup failed, timed out, or restricted for this TLD
        return None, None, None


def inspect_domain(
    url_or_domain: str,
    claimed_company: Optional[str] = None
) -> DomainInspectionReport:
    """
    Inspects a website URL or domain for:
    - Domain age & creation date via WHOIS
    - Typosquatting / brand impersonation
    - High-abuse TLDs and free hosting disguises
    - Differentiating legitimate early-stage startups from scams
    """
    clean_url, domain = normalize_domain(url_or_domain)

    # 1. Check for free hosting providers
    is_free_hosting = any(domain == p or domain.endswith(f".{p}") for p in FREE_HOSTING_PROVIDERS)

    # 2. Check TLD
    tld = domain.split(".")[-1] if "." in domain else ""
    is_suspicious_tld = tld in HIGH_ABUSE_TLDS

    # 3. Check WHOIS age & registrar
    domain_age_days, creation_str, registrar = query_whois_metadata(domain)
    is_new_domain = domain_age_days is not None and domain_age_days < 60

    # 4. Check Typosquatting / Brand Impersonation
    claimed_norm = (claimed_company or "").strip().lower()
    is_typosquatting = False
    matched_brand = None
    expected_domain = None

    base_domain = domain.split(".")[0]

    for brand, official_dom in MAJOR_BRANDS.items():
        official_base = official_dom.split(".")[0]

        # Case A: User explicitly claims to be the brand (e.g. Google, TCS)
        if brand in claimed_norm:
            matched_brand = brand.title()
            expected_domain = official_dom
            if domain != official_dom:
                is_typosquatting = True
                break

        # Case B: Domain name explicitly incorporates brand with suspicious suffixes (e.g. google-careers, tcs-portal)
        if domain != official_dom and (
            brand in domain
            or _levenshtein_distance(base_domain, official_base) <= 1
        ):
            # Check if it has keywords like career, job, hiring, intern
            suspicious_keywords = ["career", "job", "intern", "hiring", "portal", "apply", "work", "verify"]
            if any(kw in domain for kw in suspicious_keywords) or _levenshtein_distance(base_domain, official_base) <= 1:
                is_typosquatting = True
                matched_brand = brand.title()
                expected_domain = official_dom
                break

    # 5. Synthesize Status, Details, and Recommendations
    recommendations = []

    if is_typosquatting and matched_brand and expected_domain:
        status = "BRAND_IMPERSONATION"
        details = (
            f"Brand Impersonation / Phishing Alert: The website domain '{domain}' appears to mimic "
            f"{matched_brand}. The verified enterprise domain is '{expected_domain}'. "
            f"Scammers frequently purchase lookalike domains to deceive applicants."
        )
        recommendations.append(f"Never log in or share details on '{domain}'. Visit the official portal at 'https://{expected_domain}'.")
        recommendations.append("Report the fraudulent link to the company's official security / recruitment team.")

    elif is_free_hosting:
        status = "SUSPICIOUS_HOSTING"
        details = (
            f"The link '{domain}' uses a free public hosting platform. While common for student prototypes, "
            f"established corporate companies do not host their primary career portals on free shared staging tiers."
        )
        recommendations.append("Verify whether this link was created by an independent student project or an unverified party.")
        recommendations.append("Never submit passwords, banking details, or government IDs through unbranded forms.")

    elif is_suspicious_tld:
        status = "SUSPICIOUS_HOSTING"
        details = (
            f"The domain uses the '.{tld}' top-level domain. This domain extension is frequently associated with "
            f"low-cost disposable websites and rapid phishing campaigns."
        )
        recommendations.append("Cross-check the company's registered address and official primary domain.")

    elif is_new_domain and claimed_norm in MAJOR_BRANDS:
        status = "NEW_DOMAIN_WARNING"
        details = (
            f"Newly Registered Domain ({domain_age_days} days old): The domain '{domain}' was registered very recently. "
            f"Established organizations do not create brand-new domains for recruitment."
        )
        recommendations.append("Avoid clicking or submitting personal credentials on recently created recruitment domains.")

    elif is_new_domain:
        # Early-stage startup protection!
        status = "STARTUP_DOMAIN"
        age_text = f"registered {domain_age_days} days ago" if domain_age_days else "recently registered"
        details = (
            f"Early-Stage Startup Domain ({age_text}): The domain '{domain}' is recently registered. "
            f"This is completely standard for legitimate new startups and emerging ventures. "
            f"As long as they do NOT demand upfront registration, training, or equipment fees, this is typical."
        )
        recommendations.append("Verify the founding team and company mission on LinkedIn or public developer forums.")
        recommendations.append("Ensure the startup never requests any upfront payment or security deposit before starting work.")

    elif domain_age_days is not None and domain_age_days >= 365:
        status = "SAFE_ESTABLISHED"
        years = round(domain_age_days / 365, 1)
        details = (
            f"Established Domain ({years} years old): '{domain}' was registered on {creation_str or 'verified date'} "
            f"via {registrar or 'an accredited registrar'}. Longevity is a strong signal against disposable scam infrastructure."
        )
        recommendations.append("Standard diligence: Verify that the recruiter contacting you is authentically associated with this domain.")

    else:
        status = "ACTIVE_CUSTOM_DOMAIN"
        details = f"Active custom web domain '{domain}'."
        recommendations.append("Review the company website directly to confirm the internship or job vacancy is listed.")

    return DomainInspectionReport(
        url=clean_url,
        domain=domain,
        domain_age_days=domain_age_days,
        creation_date=creation_str,
        registrar=registrar,
        status=status,
        is_new_domain=is_new_domain,
        is_typosquatting=is_typosquatting,
        matched_brand=matched_brand,
        details=details,
        recommendations=recommendations,
    )
