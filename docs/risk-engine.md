# ScamLens Risk Engine Technical Specification

## Overview
The ScamLens Risk Engine is a deterministic evaluation system designed to analyse extracted facts from opportunity messages (internships, jobs, task-based work, courses) and calculate a final **Risk Indicator**. The system is evidence-first, meaning it requires explicit warning signals to increase the score, rather than relying on abstract AI judgements.

The system will **never** claim that a score "proves fraud." Instead, it provides decision support by surfacing the warning signals present and suggesting independent verification steps.

## Important Baseline Rules
To prevent false positives and maintain credibility, the engine adheres to these constraints:
1. **WhatsApp alone** must NOT increase the risk score.
2. **Telegram alone** must NOT increase the risk score.
3. **Gmail alone** must NOT increase the risk score.
4. **Missing website alone** must NOT prove fraud.
5. **High salary alone** must NOT prove fraud.
6. **Remote work alone** must NOT increase the risk score.
7. **Poor grammar** must NOT increase the risk score.
8. **Unknown company alone** must NOT prove fraud.
9. **No interview alone** should not produce a high-risk result.
10. The system must **never claim that the score proves fraud**.
11. The system must use the term **"Risk indicator"**, not "probability of scam".
12. **External company/domain verification** must remain a separate future verification layer rather than a simple text rule.

---

## Risk Levels & Scoring
Final scores are capped at a maximum of **100**.

| Score Range | Risk Level | Meaning |
| :--- | :--- | :--- |
| **0–24** | LOW | Standard opportunity with minimal or no warning signals. |
| **25–49** | MODERATE | Some concerning patterns identified. Caution advised. |
| **50–74** | HIGH | Multiple strong warning signals present. Significant caution required. |
| **75–100** | VERY HIGH | Overwhelming evidence of severe risk patterns. |

---

## Scoring Groups & Limits
To prevent the score from being artificially inflated by redundant/overlapping signals, rules are categorized into Groups. A Group Limit caps the total points that can be awarded from that category.

* **GROUP A — Direct financial harm** (Max 50 pts)
* **GROUP B — Sensitive information** (Max 40 pts)
* **GROUP C — Recruitment deception** (Max 35 pts)
* **GROUP D — Task/earning patterns** (Max 40 pts)
* **GROUP E — Pressure/urgency** (Max 20 pts)

---

## MVP Rule Set

### GROUP A: Direct Financial Harm (Max 50)

#### R01 — Upfront employment/activation/registration fee
* **Severity:** HIGH
* **Points:** 35
* **Trigger conditions:** The opportunity explicitly asks the user to pay a fee before starting work, receiving training, or accessing the platform.
* **Required evidence:** Text quoting a specific fee amount, "activation", "registration", or "refundable deposit".
* **When it should NOT trigger:** Legitimate purchases where the user is buying a standard course/product (unless disguised as employment).
* **Example suspicious:** "Pay a refundable registration fee of ₹999 to receive your employee ID."
* **Example legitimate:** "The certification exam costs ₹2000."
* **User-facing explanation:** Legitimate employers do not charge candidates to work for them.
* **Recommended action:** Do not pay any upfront fees for a job or internship.

#### R02 — Cryptocurrency/wallet payment required
* **Severity:** HIGH
* **Points:** 40
* **Trigger conditions:** The offer mandates payment or salary processing exclusively through cryptocurrency (USDT, BTC) or untraceable wallets.
* **Required evidence:** Mention of USDT, Binance, TRC20, or explicit crypto wallet addresses.
* **When it should NOT trigger:** A legitimate Web3 company mentioning crypto in the job description (but not demanding upfront deposit).
* **Example suspicious:** "Your daily salary will be paid in USDT to your Binance wallet."
* **Example legitimate:** "We are a blockchain startup building crypto infrastructure."
* **User-facing explanation:** Cryptocurrency payments are largely untraceable and frequently used to avoid banking regulations.
* **Recommended action:** Verify the company's legal registration and insist on standard bank transfers.

#### R05 — User must deposit/recharge their own money to perform or unlock work
* **Severity:** HIGH
* **Points:** 35
* **Trigger conditions:** The user is required to deposit money into a platform to "recharge" their account to unlock higher-tier tasks.
* **Required evidence:** Terms like "recharge account", "deposit to unlock", "VIP levels".
* **When it should NOT trigger:** Standard gig-economy platforms taking a percentage cut of earnings.
* **Example suspicious:** "You must recharge ₹5000 to unlock VIP2 tasks."
* **Example legitimate:** "Upwork takes a 10% service fee on your earnings."
* **User-facing explanation:** Legitimate task platforms pay you; they do not require you to risk your own capital to work.
* **Recommended action:** Cease communication. Do not deposit funds.

#### R06 — Receive/forward money, fake-check, gift-card, or money-transfer employment pattern
* **Severity:** HIGH
* **Points:** 35
* **Trigger conditions:** The core job involves receiving funds into a personal account and forwarding them elsewhere, or buying gift cards.
* **Required evidence:** "Process payments", "buy gift cards", "transfer to our agent".
* **When it should NOT trigger:** Standard accounting or cashier roles at physical locations.
* **Example suspicious:** "We will send you a check. Keep 10% and wire the rest to our supplier."
* **Example legitimate:** "You will handle corporate expense reports."
* **User-facing explanation:** This pattern often indicates money laundering or a fake-check scam where the initial funds will bounce.
* **Recommended action:** Do not use your personal bank account to process third-party funds.

---

### GROUP B: Sensitive Information (Max 40)

#### R03 — Sensitive financial or identity information requested prematurely
* **Severity:** HIGH
* **Points:** 30
* **Trigger conditions:** Requesting deep sensitive data (passwords, OTPs, Aadhaar, PAN) via casual channels before a formal offer.
* **Required evidence:** "Send your OTP", "Need Aadhaar for verification now" in early chat phases.
* **When it should NOT trigger:** A secure, official onboarding portal (e.g., Workday) after a contract is signed.
* **Example suspicious:** "Send your bank details and PAN card photo here on WhatsApp to register."
* **Example legitimate:** "Please complete your tax forms via our secure HR portal."
* **User-facing explanation:** Identity documents and banking credentials should only be shared through secure official HR channels after an offer is finalized.
* **Recommended action:** Never share OTPs or passwords. Verify the employer before sharing ID documents.

---

### GROUP C: Recruitment Deception (Max 35)

#### R07 — Personal/free email used while claiming to represent an organisation
* **Severity:** MEDIUM
* **Points:** 20
* **Trigger conditions:** The sender claims to represent a known company (e.g., Amazon, Google) but uses a @gmail.com or @yahoo.com address.
* **Required evidence:** Sender email does not match the corporate domain claimed in the text.
* **When it should NOT trigger:** The employer is an individual, small local business, or explicitly states they are a freelance client.
* **Example suspicious:** "I am the HR manager at Microsoft. Reply to microsoft.hr.desk@gmail.com."
* **Example legitimate:** "I run a small bakery. Email me at sarahs.bakery@gmail.com."
* **User-facing explanation:** Official corporate representatives will almost always use their company's official email domain.
* **Recommended action:** Contact the company directly through their official website to verify the recruiter.

#### R08 — Unexpected recruiter contact
* **Severity:** MEDIUM
* **Points:** 15
* **Trigger conditions:** The recruiter reaches out via a casual channel (WhatsApp/Telegram) completely unsolicited, especially from an unknown international number.
* **Required evidence:** "Found your number through recruitment agency", "Are you looking for part-time work?"
* **When it should NOT trigger:** Standard LinkedIn InMail or if the user recently applied to the company.
* **Example suspicious:** "Hi, I am HR from [Company]. We found your number in our database. Do you want to earn ₹3000/day?"
* **Example legitimate:** "Hi, I saw your application on our careers page."
* **User-facing explanation:** Unsolicited casual messages offering employment are a common recruitment tactic for fraudulent schemes.
* **Recommended action:** Ask where they found your profile and verify their identity.

#### R09 — Instant selection or no normal hiring process
* **Severity:** MEDIUM
* **Points:** 15
* **Trigger conditions:** The user is offered the job immediately without an interview, portfolio review, or assessment.
* **Required evidence:** "You are hired", "Start immediately", "No interview required".
* **When it should NOT trigger:** Standard micro-task platforms (e.g., Amazon MTurk) where instant sign-up is normal.
* **Example suspicious:** "Congratulations, your profile is shortlisted. You are hired. Pay the fee to start."
* **Example legitimate:** "Please schedule a 30-minute introductory call."
* **User-facing explanation:** Legitimate employment typically involves an evaluation process to ensure a mutual fit.
* **Recommended action:** Treat guaranteed instant employment with skepticism, especially if combined with fees.

---

### GROUP D: Task/Earning Patterns (Max 40)

#### R04 — Task-scam pattern (product optimisation, boosting, liking)
* **Severity:** HIGH
* **Points:** 30
* **Trigger conditions:** The job involves superficial tasks that artificially inflate metrics (liking YouTube videos, reviewing hotels, "optimising" products).
* **Required evidence:** "Like 3 videos", "Optimise app ratings", "Merchant data boosting".
* **When it should NOT trigger:** Legitimate social media management or digital marketing roles (requiring strategy/creation, not just clicking).
* **Example suspicious:** "Earn ₹50 for every YouTube video you like. We will send 20 links a day."
* **Example legitimate:** "You will manage our social media calendar and respond to comments."
* **User-facing explanation:** Paying users directly to blindly like content or rate products is a well-known structure for task-based fraud.
* **Recommended action:** Research "task scams" and avoid participating in metric manipulation.

#### R10 — Guaranteed/easy-money/unrealistic earning claim
* **Severity:** MEDIUM
* **Points:** 15
* **Trigger conditions:** The offer promises unusually high earnings for trivial effort or guarantees returns.
* **Required evidence:** "Earn ₹5000/day working 1 hour from phone", "Guaranteed daily returns".
* **When it should NOT trigger:** Standard high-paying technical or executive roles with clear, complex requirements.
* **Example suspicious:** "Work from your smartphone for 30 minutes and earn ₹10,000 guaranteed."
* **Example legitimate:** "Senior Software Engineer: ₹30LPA - ₹45LPA."
* **User-facing explanation:** Extremely high compensation for unskilled, low-effort work is often used as a lure.
* **Recommended action:** Compare the offered compensation with industry standards for similar work.

---

### GROUP E: Pressure/Urgency (Max 20)

#### R11 — Extreme urgency, pressure, or threats
* **Severity:** LOW
* **Points:** 10
* **Trigger conditions:** The sender uses high-pressure tactics or threats to force an immediate decision or payment.
* **Required evidence:** "Offer expires in 10 minutes", "Legal action will be taken if you don't pay".
* **When it should NOT trigger:** A standard, reasonable offer deadline (e.g., "Please sign the offer letter by Friday").
* **Example suspicious:** "If the registration is not paid in 15 minutes, your account will be frozen."
* **Example legitimate:** "Please let us know your decision by the end of the week."
* **User-facing explanation:** High-pressure tactics are designed to force you to act quickly without thinking or verifying.
* **Recommended action:** Take your time. Never make financial decisions under pressure.

---

## Final Scoring Algorithm

1. **Extracted Facts**: The engine (via LLM extraction) identifies factual components in the user's submission.
2. **Evaluate Rules**: The extracted facts are checked against R01–R11. Each matched rule generates a signal (Severity, Points).
3. **Group Related Signals**: Signals are bucketed into Groups A through E.
4. **Apply Group Limits**: The total points for each group are capped at their maximum threshold.
5. **Calculate Score**: The capped group scores are summed together.
6. **Cap at 100**: The final score is hard-capped at a maximum of 100.
7. **Determine Risk Level**: The final score maps to LOW, MODERATE, HIGH, or VERY HIGH.
8. **Return Evidence**: The engine returns the final score, the categorized signals (with exact evidence quotes), and the recommended actions to the UI.

---

## Example Score Calculations

### Example 1: Normal internship with no payment request
* **Input**: "Hi, we reviewed your application for the Frontend Intern role at TechCorp. We'd like to schedule a technical interview this Thursday. Let us know if 2 PM works."
* **Triggered Rules**: None.
* **Calculation**: Score = 0
* **Risk Level**: LOW
* **Result**: The engine correctly identifies this as a standard process and does not flag it.

### Example 2: Internship asking for registration fee
* **Input**: "Congratulations! You are selected for the remote internship at DataSys. To secure your spot and receive your laptop, please pay a refundable ₹999 onboarding fee."
* **Triggered Rules**: 
  * R01 (+35)
* **Final Score**: 35 — MODERATE
* **Result**: Flags the upfront fee.
* **Note**: An upfront registration fee is a strong warning signal, but the absence of an interview must not be assumed unless the submitted information explicitly indicates it.

### Example 3: WhatsApp task offer + Activation fee + USDT payment
* **Input**: "Hello I am HR from global agency. Do you want to earn money? Just like 5 YouTube videos a day. You need to recharge VIP1 for ₹1000 first. Salary paid in USDT." (Sent on WhatsApp unsolicited)
* **Triggered Rules**:
  * R08 (Unexpected contact) = 15 pts
  * R04 (Task-scam pattern) = 30 pts
  * R05 (Recharge own money) = 35 pts
  * R02 (Crypto payment) = 40 pts
* **Calculation**:
  * Group A: R05 (35) + R02 (40) = 75 → Capped at 50
  * Group C: R08 (15) = 15
  * Group D: R04 (30) = 30
  * Total = 50 + 15 + 30 = 95
* **Risk Level**: VERY HIGH
* **Result**: Successfully handles multiple severe financial red flags by grouping them, preventing a runaway score while clearly flagging extreme risk.

### Example 4: Fake recruiter using Gmail + instant selection + unrealistic earnings
* **Input**: "I am the hiring manager at Amazon. You are hired for a work from home role. Earn ₹15,000 daily working 1 hour. Reply with your bank details to amazon.jobs.india123@gmail.com."
* **Triggered Rules**:
  * R07 (Personal email for corporate) = 20 pts
  * R09 (Instant selection) = 15 pts
  * R10 (Unrealistic earnings) = 15 pts
  * R03 (Sensitive info prematurely) = 30 pts
* **Calculation**:
  * Group B: R03 (30) = 30
  * Group C: R07 (20) + R09 (15) = 35 (Capped at 35)
  * Group D: R10 (15) = 15
  * Total = 30 + 35 + 15 = 80
* **Risk Level**: VERY HIGH
* **Result**: Identifies the corporate impersonation via Gmail and the dangerous data request.

### Example 5: Task offer requiring the user to deposit money to unlock tasks
* **Input**: "Register on our merchant portal. Deposit ₹5000 to unlock Level 2 product optimization tasks. High daily returns guaranteed."
* **Triggered Rules**:
  * R05 (Deposit own money) = 35 pts
  * R04 (Product optimization) = 30 pts
  * R10 (Guaranteed returns) = 15 pts
* **Calculation**:
  * Group A: R05 (35) = 35
  * Group D: R04 (30) + R10 (15) = 45 → Capped at 40
  * Total = 35 + 40 = 75
* **Risk Level**: VERY HIGH
* **Result**: Strongly flags the pay-to-work structure.
