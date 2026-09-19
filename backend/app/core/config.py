from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Scamalyse API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Gemini AI configuration
    GEMINI_API_KEY: str | None = None
    GEMINI_API_KEY1: str | None = None
    GEMINI_API_KEY2: str | None = None
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"
    
    def get_gemini_keys(self) -> list[str]:
        """Returns all configured non-empty Gemini API keys in order of priority."""
        keys: list[str] = []
        for k in [self.GEMINI_API_KEY, self.GEMINI_API_KEY1, self.GEMINI_API_KEY2]:
            if k and isinstance(k, str) and k.strip() and k.strip() not in keys:
                keys.append(k.strip())
        return keys

    # CORS Origins
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173"]

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
