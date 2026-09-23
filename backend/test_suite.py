import requests
import json
import time

API_URL = "http://127.0.0.1:8000/api/v1/analyze"

payloads = [
    {
        "name": "1. Suspicious Telegram Task Scam",
        "data": {
            "opportunity_text": "Hi dear, I am HR from Google. We have a part-time job for you. Just like Youtube videos and earn 5000 INR daily. Message me on Telegram @hr_google to start immediately. No interview required.",
        }
    },
    {
        "name": "2. Legitimate Looking Email but Typosquatted",
        "data": {
            "opportunity_text": "Dear Applicant, We are pleased to offer you the Software Engineer Intern role at Microsoft. Please review the attached contract and submit the $15 background check fee to our payment portal. Regards, Microsoft HR.",
            "sender_email": "hr@micros0ft-careers.com"
        }
    },
    {
        "name": "3. WhatsApp Urgent Crypto Scam",
        "data": {
            "opportunity_text": "URGENT: Your Binance account is blocked. Verify your KYC within 2 hours or your funds will be frozen. Click here: http://binance-kyc-verify.net",
        }
    },
    {
        "name": "4. Valid Text (No Scam)",
        "data": {
            "opportunity_text": "Hello, this is John from TechCorp. We received your resume and would like to schedule a 30-minute introductory call next Tuesday. Let me know your availability. Best, John.",
            "sender_email": "john@techcorp.com"
        }
    }
]

for p in payloads:
    print(f"--- Running Test: {p['name']} ---")
    try:
        response = requests.post(API_URL, data=p['data'])
        if response.status_code == 200:
            res = response.json()
            score = res.get('risk_indicator', {}).get('score')
            level = res.get('risk_indicator', {}).get('level')
            print(f"Result: {score}/100 [{level}]")
            for sig in res.get('triggered_risk_signals', [])[:3]:
                print(f"  🚨 {sig['title']} (+{sig['points']}): {sig['explanation']}")
            if res.get('safe_signals'):
                print(f"  ✅ {res['safe_signals'][0]['title']}")
        else:
            print(f"Error {response.status_code}: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")
    print("\n")
    time.sleep(1)
