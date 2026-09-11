from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()

@router.get("/health", response_model=dict)
def health_check():
    """
    Check backend availability.
    """
    return {
        "status": "ok",
        "version": settings.VERSION,
        "service": settings.PROJECT_NAME
    }
