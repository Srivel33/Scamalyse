from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import datetime

from .session import Base

class AnalysisCache(Base):
    __tablename__ = "analysis_cache"

    input_hash = Column(String(64), primary_key=True, index=True)
    response_payload = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    feedbacks = relationship("UserFeedback", back_populates="analysis")


class UserFeedback(Base):
    __tablename__ = "user_feedback"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    analysis_hash = Column(String(64), ForeignKey("analysis_cache.input_hash"), index=True)
    feedback_type = Column(String(50), nullable=False)  # "scam", "not_scam", "unsure"
    detailed_feedback = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    analysis = relationship("AnalysisCache", back_populates="feedbacks")
