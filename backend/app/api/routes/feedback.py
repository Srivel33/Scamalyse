from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import UserFeedback, AnalysisCache
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class FeedbackRequest(BaseModel):
    analysis_hash: str
    feedback_type: str  # "scam", "not_scam", "unsure"
    detailed_feedback: Optional[str] = None

@router.post("/feedback")
def submit_feedback(feedback: FeedbackRequest, db: Session = Depends(get_db)):
    # Verify the hash exists in the cache to prevent spam/orphans
    cache_entry = db.query(AnalysisCache).filter(AnalysisCache.input_hash == feedback.analysis_hash).first()
    if not cache_entry:
        raise HTTPException(status_code=404, detail="Original analysis not found.")

    if feedback.feedback_type not in ["scam", "not_scam", "unsure"]:
        raise HTTPException(status_code=400, detail="Invalid feedback type.")

    new_feedback = UserFeedback(
        analysis_hash=feedback.analysis_hash,
        feedback_type=feedback.feedback_type,
        detailed_feedback=feedback.detailed_feedback
    )
    
    db.add(new_feedback)
    db.commit()
    
    return {"status": "success", "message": "Feedback recorded successfully."}
