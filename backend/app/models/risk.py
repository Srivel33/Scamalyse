from pydantic import BaseModel
from typing import List, Optional

class EvidenceQuote(BaseModel):
    quote: str
    source: str = "submitted_text"

class TriggeredRule(BaseModel):
    rule_id: str
    title: str
    points: int
    severity: str
    evidence: List[EvidenceQuote]
    explanation: str
    recommended_action: str

class RiskReport(BaseModel):
    score: int
    level: str
    triggered_signals: List[TriggeredRule]
