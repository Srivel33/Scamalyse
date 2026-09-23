import pytest
from unittest.mock import patch
from app.services.domain_inspector import (
    inspect_domain,
    extract_urls_from_text,
    normalize_domain,
    DomainInspectionReport
)
from app.services.risk_engine import evaluate_risk
from app.schemas.gemini import GeminiExtractionSchema

def test_extract_urls_from_text():
    text = "Apply on our portal https://careers.zoho.com/jobs or check http://google-careers.net! Contact hr@example.com."
    urls = extract_urls_from_text(text)
    assert "https://careers.zoho.com/jobs" in urls
    assert "http://google-careers.net" in urls
    assert "hr@example.com" not in urls

def test_normalize_domain():
    url, dom = normalize_domain("https://www.google.com/careers?id=123")
    assert dom == "google.com"
    assert url == "https://www.google.com/careers?id=123"

    url2, dom2 = normalize_domain("careers-portal.org")
    assert dom2 == "careers-portal.org"
    assert url2 == "https://careers-portal.org"

def test_brand_impersonation_typosquatting():
    # Domain mimicking Google
    report = inspect_domain("google-careers-portal.com", claimed_company="Google")
    assert report.is_typosquatting is True
    assert report.status == "BRAND_IMPERSONATION"
    assert report.matched_brand == "Google"
    assert "Brand Impersonation" in report.details

def test_free_hosting_provider():
    report = inspect_domain("https://tcs-recruitment.firebaseapp.com", claimed_company="TCS")
    assert report.status in ["BRAND_IMPERSONATION", "SUSPICIOUS_HOSTING"]
    assert "free public hosting" in report.details or "mimic" in report.details

def test_suspicious_tld():
    report = inspect_domain("https://urgent-hiring-jobs.xyz", claimed_company="Unknown")
    assert report.status == "SUSPICIOUS_HOSTING"
    assert ".xyz" in report.details

def test_startup_domain_protection():
    # Mock newly registered domain (15 days old) for an independent startup
    with patch("app.services.domain_inspector.query_whois_metadata", return_value=(15, "2026-09-01", "Namecheap, Inc.")):
        report = inspect_domain("https://nexus-ai-robotics.io", claimed_company="Nexus AI Labs")
        assert report.status == "STARTUP_DOMAIN"
        assert report.is_new_domain is True
        assert report.is_typosquatting is False
        assert "Early-Stage Startup Domain" in report.details
        assert "standard for legitimate new startups" in report.details

def test_established_domain():
    # Mock domain with 5 years of registration
    with patch("app.services.domain_inspector.query_whois_metadata", return_value=(1825, "2021-09-01", "GoDaddy.com, LLC")):
        report = inspect_domain("https://acme-corp.com", claimed_company="Acme Corp")
        assert report.status == "SAFE_ESTABLISHED"
        assert report.domain_age_days == 1825
        assert "Established Domain" in report.details

from tests.test_risk_engine import get_base_schema

def test_risk_engine_website_rules():
    # Test R19 (Phishing / Lookalike domain)
    phishing_report = DomainInspectionReport(
        url="https://google-careers-portal.com",
        domain="google-careers-portal.com",
        domain_age_days=10,
        creation_date="2026-09-10",
        registrar="Namecheap",
        status="BRAND_IMPERSONATION",
        is_new_domain=True,
        is_typosquatting=True,
        matched_brand="Google",
        details="Phishing lookalike domain for Google",
        recommendations=["Do not visit"]
    )
    schema = get_base_schema()
    result = evaluate_risk(schema, website_report=phishing_report)
    r19_signals = [s for s in result.triggered_signals if s.rule_id == "R19"]
    assert len(r19_signals) == 1
    assert r19_signals[0].points == 30

    # Test S09 (Established domain longevity safe signal)
    established_report = DomainInspectionReport(
        url="https://zoho.com",
        domain="zoho.com",
        domain_age_days=5000,
        creation_date="2010-01-01",
        registrar="MarkMonitor",
        status="SAFE_ESTABLISHED",
        is_new_domain=False,
        is_typosquatting=False,
        matched_brand=None,
        details="Established domain",
        recommendations=[]
    )
    res_established = evaluate_risk(schema, website_report=established_report)
    s09_signals = [s for s in res_established.safe_signals if s.rule_id == "S09"]
    assert len(s09_signals) == 1
    assert s09_signals[0].points == 10
