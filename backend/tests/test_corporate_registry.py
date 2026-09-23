from app.services.corporate_registry import verify_corporate_entity

def test_verified_active_corporates():
    """Legitimate companies must return ACTIVE status with MCA CIN confirmation."""
    for company in ["Google", "Microsoft", "Amazon India", "TCS", "Infosys", "Zoho", "Wipro"]:
        res = verify_corporate_entity(company)
        assert res["status"] == "ACTIVE"
        assert res["verified"] is True
        assert res["has_own_website"] is True
        assert len(res["platforms_detected"]) > 0

def test_verified_tech_startups():
    """Startups with GitHub or recognized ecosystem presence must return VERIFIED_STARTUP."""
    for company in ["Vercel", "Supabase", "Stripe", "Razorpay", "Postman"]:
        res = verify_corporate_entity(company)
        assert res["status"] == "VERIFIED_STARTUP"
        assert res["verified"] is True
        assert res["has_own_website"] is True
        assert len(res["platforms_detected"]) > 0

def test_unregistered_ghost_companies():
    """Fictitious or unlisted entities must return UNREGISTERED so Rule R25 (+25 pts) fires."""
    for company in ["Apex Analytics", "Global Tech Synergy", "Data Entry Pro", "Fast Tasks Online"]:
        res = verify_corporate_entity(company)
        assert res["status"] == "UNREGISTERED"
        assert res["verified"] is False
        assert "could not be definitively found" in res["details"]

def test_struck_off_fraud_companies():
    """Blacklisted or dissolved shell entities must return STRUCK_OFF so Rule R26 (+50 pts) fires."""
    for company in ["Scam Corp", "Fake Enterprises", "Easy Money Ltd", "Task Earn Inc"]:
        res = verify_corporate_entity(company)
        assert res["status"] == "STRUCK_OFF"
        assert "Struck Off" in res["details"]

def test_unspecified_neutral_company():
    """When no company is given (e.g. freelance gig), do not penalize the applicant."""
    for empty in ["Unknown", "UNKNOWN", "Not Specified", "None", "N/A", ""]:
        res = verify_corporate_entity(empty)
        assert res["status"] == "NOT_APPLICABLE"
        assert res["verified"] is False
