from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import health, analyze, feedback
from app.db.session import engine, Base
import app.db.models  # to ensure models are registered

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Scamalyse — AI-powered internship and job offer scam detection API."
)

# Set up CORS
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Basic root endpoint
@app.get("/", tags=["root"])
def read_root():
    return {
        "message": "Scamalyse FastAPI backend is running!",
        "docs_url": "/docs"
    }

# Register API routers
app.include_router(health.router, prefix=settings.API_V1_STR, tags=["health"])
app.include_router(analyze.router, prefix=settings.API_V1_STR, tags=["analyze"])
app.include_router(feedback.router, prefix=settings.API_V1_STR, tags=["feedback"])
