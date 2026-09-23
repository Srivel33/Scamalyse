import pytest
from unittest.mock import patch, MagicMock
from app.services.email_domain_verifier import verify_email_domain, check_dns_mx

def test_invalid_email_syntax():
    report = verify_email_domain("not-an-email")
    assert report.is_valid_syntax is False
    assert report.status == "INVALID_SYNTAX"

def test_disposable_email():
    report = verify_email_domain("scammer@mailinator.com")
    assert report.is_disposable is True
    assert report.status == "DISPOSABLE"

def test_free_webmail():
    report = verify_email_domain("recruiter@gmail.com")
    assert report.is_free_webmail is True
    assert report.status == "FREE_WEBMAIL"

def test_brand_impersonation_with_gmail():
    # Claiming to be Google while using @gmail.com
    report = verify_email_domain("hr-google@gmail.com", claimed_company="Google")
    assert report.brand_impersonation_detected is True
    assert report.impersonated_brand == "Google"
    assert report.status == "BRAND_IMPERSONATION"
    assert "Brand Impersonation Warning" in report.details

def test_brand_impersonation_with_lookalike_domain():
    # Claiming to be TCS with lookalike domain tcs-careers.com
    report = verify_email_domain("careers@tcs-careers-online.com", claimed_company="TCS")
    assert report.brand_impersonation_detected is True
    assert report.impersonated_brand == "Tcs"
    assert report.status == "BRAND_IMPERSONATION"

@patch("app.services.email_domain_verifier.check_dns_mx")
def test_invalid_mx_domain(mock_mx):
    mock_mx.return_value = (False, [])
    report = verify_email_domain("hr@fake-nonexistent-domain-xyz123.com", claimed_company="RandomCo")
    assert report.has_mx_records is False
    assert report.status == "INVALID_MX"
    assert "no working DNS mail servers" in report.details

@patch("app.services.email_domain_verifier.check_dns_mx")
def test_verified_corporate_domain(mock_mx):
    mock_mx.return_value = (True, ["aspmx.l.google.com"])
    report = verify_email_domain("recruiter@innovatetech.io", claimed_company="InnovateTech")
    assert report.has_mx_records is True
    assert report.status == "VERIFIED_CORPORATE"
    assert report.brand_impersonation_detected is False
