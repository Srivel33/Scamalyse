// Mock data for demo and UI state testing.
// Replace with real API response shape in Phase 4 (backend integration).

export const PRESET_SAMPLES = [
  {
    id: "aicte-internship",
    title: "AICTE Training-cum-Internship",
    subtitle: "Aenexz Tech Google Form trap",
    badge: "Predatory EdTech",
    badgeType: "danger",
    text: `Dear Students,
Srivel T - Sns college of technology - 3 - AIML

We are pleased to announce the launch of our Training, Internship & Placement Certification Program, offered in collaboration with AICTE and facilitated by Aenexz Tech alongside our MNC partners.

Please submit your application early, as cohort seats are limited: 

https://forms.gle/s4ywUUaPnmUzA52Z7

PROGRAM HIGHLIGHTS
Audience: Open to all graduates and freshers seeking job-ready technical skills.
Structure: 2 months of live online technical training followed by placement assistance from Month 3 onwards.
Career Services: Resume workshops, mock interviews, and direct placement drives with startups and corporate hiring partners.
Recognition: Verified certification awarded upon successful program completion.

ELIGIBILITY & SELECTION
Cohorts are limited to 20-25 participants.
Selection is conducted on a rolling basis.
Placement assistance is reserved exclusively for candidates who complete all coursework and assessments.

APPLY TODAY 
If you have questions, feel free to reply directly to this message.

Best regards,
Admissions Team Aenexz Tech & Partnered MNCs`,
    source: "Email",
    appliedFirst: "no",
  },
  {
    id: "amazon-laptop",
    title: "Corporate Laptop Deposit Scam",
    subtitle: "Fake Amazon remote job asking ₹3,500 UPI",
    badge: "Fee Scam",
    badgeType: "danger",
    text: `Dear Candidate,

Congratulations! Following your profile review, you have been selected for the position of Operations Associate at Amazon India Remote Support. 

Monthly Compensation: ₹45,000 / month + health benefits.
Location: 100% Work from Home.

Before dispatching your company Apple MacBook Pro and work accessories, company policy mandates a refundable equipment security deposit of ₹3,500. This amount must be paid to our logistics partner via UPI ID: hr.amazonlogistics@okaxis within 2 hours to confirm your employee ID dispatch. 

This deposit is 100% reimbursed on your first salary disbursement. Reply with your payment confirmation screenshot.

Warm regards,
Amazon India HR Recruitment Team
Email: amazon.hr.recruitment2026@gmail.com`,
    source: "Email",
    appliedFirst: "no",
  },
  {
    id: "telegram-task",
    title: "Telegram Daily Task & YouTube Scam",
    badge: "Task Fraud",
    badgeType: "danger",
    subtitle: "Like YouTube videos for daily ₹3,000",
    text: `Part-time Job Alert for College Students! Earn ₹2,000 to ₹5,000 daily from your phone.

Work involves liking YouTube videos, rating Google Maps locations, and following Instagram accounts. 
Takes only 15-20 minutes a day. Daily instant withdrawal via UPI.

We have paid ₹150 for your trial task. To unlock VIP-1 tasks and withdraw your balance, contact our regional task manager Miss Neha on Telegram @GlobalTasksVIP and deposit ₹1,000 account activation fee. Complete within 30 minutes to get 50% joining bonus!`,
    source: "Telegram",
    appliedFirst: "no",
  },
  {
    id: "legitimate-internship",
    title: "Legitimate Campus Internship Offer",
    badge: "Genuine",
    badgeType: "success",
    subtitle: "Official Zoho offer after technical rounds",
    text: `Dear Srivel,

Following your technical interview rounds and evaluation with our Engineering team, we are pleased to offer you the Software Engineering Summer Internship at Zoho Corporation.

Role: Software Development Intern
Location: Zoho Campus, Chennai / Remote
Duration: 3 months starting June 2026
Stipend: ₹25,000 per month

Please review your formal offer letter and employment terms by logging into our official careers portal at https://careers.zoho.com using your registered candidate credentials. 

Zoho does not charge any application, registration, or equipment fees at any stage of hiring.

Best regards,
Zoho University Relations & Campus Recruitment`,
    source: "Email",
    appliedFirst: "yes",
  }
];

export const DEMO_INPUT = {
  text: "Congratulations! You have been selected for a Product Optimisation Associate opportunity. Earn ₹3,000 every day by completing simple product optimisation tasks. To activate your account, pay a ₹999 registration fee. Payment can be made through USDT. Complete the activation within 30 minutes.",
  source: "WhatsApp",
  senderContact: "",
  appliedFirst: "no",
  salaryIncentive: "₹3,000/day",
  unsureReason: "",
};

export const HIGH_RISK_RESULT = {
  riskScore: 100,
  riskLevel: "high",
  category: "Task Work",
  opportunitySummary: {
    company: "Unknown",
    role: "Product Optimisation Associate",
    category: "Task Work",
    salaryClaim: "₹3,000/day",
    source: "WhatsApp",
  },
  evidenceSignals: [
    {
      id: "sig-1",
      title: "Crypto / wallet payment request",
      points: 40,
      evidence: '"Payment can be made through USDT."',
      explanation:
        "Requests for cryptocurrency payments are a strong warning signal. Legitimate employers in India do not request USDT payments for activation.",
    },
    {
      id: "sig-2",
      title: "Upfront activation fee",
      points: 35,
      evidence: '"To activate your account, pay a ₹999 registration fee."',
      explanation:
        "Legitimate employers never charge candidates for account activation or registration. This is a hallmark pattern of task-work scams.",
    },
    {
      id: "sig-3",
      title: "Urgent time pressure",
      points: 10,
      evidence: '"Complete the activation within 30 minutes."',
      explanation:
        "Artificial urgency is a pressure tactic used to prevent careful evaluation. Legitimate offers do not expire in 30 minutes.",
    },
    {
      id: "sig-4",
      title: "Task-work income claim",
      points: 25,
      evidence: '"Earn ₹3,000 every day by completing simple product optimisation tasks."',
      explanation:
        "Unusually high daily earnings for simple, unverified tasks are a common pattern in task-work opportunity scams targeting students.",
    },
  ],
  extractedFacts: {
    company: "Unknown",
    role: "Product Optimisation Associate",
    opportunityType: "Task-based work",
    salaryClaim: "₹3,000/day",
    paymentRequest: "Yes — ₹999 registration fee",
    paymentMethod: "USDT (Cryptocurrency)",
    contactMethod: "WhatsApp",
    website: "Not provided",
    urgency: "30-minute activation deadline",
    selectionProcess: "Pre-selected (no interview mentioned)",
    sensitiveInfoRequested: "Payment",
  },
  recommendedActions: [
    "Do not pay the requested ₹999 activation fee.",
    "Verify the company through its official website or official company registry.",
    "Contact the company through an independently found official channel — not the number that contacted you.",
    "Do not share OTPs, banking information, or identity documents.",
    "Search independently for complaints or reports about this opportunity.",
  ],
  verificationInfo: {
    company: "Unknown",
    website: "Not provided",
    officialEmail: "Unknown",
    officialSocials: "Not identified",
    externalResearch: null,
  },
  clarificationQuestion: {
    context: "We found a company name mention was absent.",
    question: "Do you know the company's official website or registered name?",
    field: "website",
  },
};

export const MEDIUM_RISK_RESULT = {
  riskScore: 48,
  riskLevel: "medium",
  category: "Internship",
  opportunitySummary: {
    company: "GreenTech Solutions Pvt. Ltd.",
    role: "Marketing Intern",
    category: "Internship",
    salaryClaim: "₹5,000/month stipend",
    source: "LinkedIn",
  },
  evidenceSignals: [
    {
      id: "sig-1",
      title: "Unverified company domain",
      points: 20,
      evidence: '"Contact us at hr@greentech-solutions.in"',
      explanation:
        "The email domain does not match a verified official company registration. This warrants independent verification.",
    },
    {
      id: "sig-2",
      title: "Limited company information",
      points: 15,
      evidence: "No official website URL was provided in the offer.",
      explanation:
        "Legitimate organisations typically provide verifiable contact details and official website links.",
    },
    {
      id: "sig-3",
      title: "Unprompted contact",
      points: 13,
      evidence: '"You have been directly selected based on your LinkedIn profile."',
      explanation:
        "Unsolicited direct selection without a formal application or interview can indicate low verification standards or opportunistic targeting.",
    },
  ],
  extractedFacts: {
    company: "GreenTech Solutions Pvt. Ltd.",
    role: "Marketing Intern",
    opportunityType: "Internship",
    salaryClaim: "₹5,000/month",
    paymentRequest: "None mentioned",
    paymentMethod: "N/A",
    contactMethod: "LinkedIn",
    website: "Not provided",
    urgency: "None detected",
    selectionProcess: "Direct LinkedIn approach",
    sensitiveInfoRequested: "None detected",
  },
  recommendedActions: [
    "Verify GreenTech Solutions Pvt. Ltd. on the MCA company registry.",
    "Confirm the official website and email domain match.",
    "Ask for a formal offer letter on company letterhead.",
    "Search independently for reviews or reports about this company.",
    "Proceed with caution — do not share sensitive documents until verification is complete.",
  ],
  verificationInfo: {
    company: "GreenTech Solutions Pvt. Ltd.",
    website: "Not provided",
    officialEmail: "hr@greentech-solutions.in (unverified)",
    officialSocials: "LinkedIn — unverified",
    externalResearch: null,
  },
  clarificationQuestion: null,
};

export const LOW_RISK_RESULT = {
  riskScore: 12,
  riskLevel: "low",
  category: "Internship",
  opportunitySummary: {
    company: "Acme Corp India",
    role: "Software Engineering Intern",
    category: "Internship",
    salaryClaim: "₹20,000/month",
    source: "Email",
  },
  evidenceSignals: [
    {
      id: "sig-1",
      title: "No official application process mentioned",
      points: 12,
      evidence:
        '"We reviewed your resume submitted through our careers portal and would like to invite you for an interview."',
      explanation:
        "A minor signal — the offer references a prior application, which is expected, but the absence of an official offer letter in this snippet warrants a follow-up.",
    },
  ],
  extractedFacts: {
    company: "Acme Corp India",
    role: "Software Engineering Intern",
    opportunityType: "Internship",
    salaryClaim: "₹20,000/month",
    paymentRequest: "None",
    paymentMethod: "N/A",
    contactMethod: "Official company email",
    website: "www.acmecorp.in (referenced)",
    urgency: "None detected",
    selectionProcess: "Prior application + interview invitation",
    sensitiveInfoRequested: "None",
  },
  recommendedActions: [
    "Confirm the sender email domain matches the official company website.",
    "Review the offer letter for standard employment terms.",
    "This appears to be a normal recruitment process. Proceed with standard due diligence.",
  ],
  verificationInfo: {
    company: "Acme Corp India",
    website: "www.acmecorp.in",
    officialEmail: "careers@acmecorp.in (referenced)",
    officialSocials: "LinkedIn — Acme Corp India",
    externalResearch:
      "Company registered with MCA. LinkedIn presence with 500+ employees confirmed.",
  },
  clarificationQuestion: null,
};
