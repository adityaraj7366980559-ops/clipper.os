import os
from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[3]
if BASE_DIR.name == "apps":
    BASE_DIR = BASE_DIR.parent
DATA_DIR = BASE_DIR / "data"

class Settings(BaseSettings):
    PROJECT_NAME: str = "ClipForge"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "clipforge-super-secret-production-key-change-in-prod-xyz-2026"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = f"sqlite+aiosqlite:///{(DATA_DIR / 'clipforge.db').as_posix()}"
    
    # Storage
    STORAGE_TYPE: str = "local"  # local | s3
    UPLOAD_DIR: Path = DATA_DIR / "uploads"
    PROXY_DIR: Path = DATA_DIR / "proxies"
    EXPORT_DIR: Path = DATA_DIR / "exports"
    CACHE_DIR: Path = DATA_DIR / "cache"
    
    # S3 Storage settings (optional)
    S3_ENDPOINT: Optional[str] = None
    S3_ACCESS_KEY: Optional[str] = None
    S3_SECRET_KEY: Optional[str] = None
    S3_BUCKET: str = "clipforge-media"
    S3_REGION: str = "us-east-1"
    
    # AI Providers
    LLM_PROVIDER: str = "gemini"  # gemini | openai | anthropic | ollama | mock
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    ANTHROPIC_API_KEY: Optional[str] = os.getenv("ANTHROPIC_API_KEY")
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"
    
    # Transcriber Provider
    TRANSCRIBER_PROVIDER: str = "local"  # local | gemini | openai | deepgram
    DEEPGRAM_API_KEY: Optional[str] = os.getenv("DEEPGRAM_API_KEY")
    
    # Stock Media
    PEXELS_API_KEY: Optional[str] = os.getenv("PEXELS_API_KEY")
    PIXABAY_API_KEY: Optional[str] = os.getenv("PIXABAY_API_KEY")
    
    # YouTube & Downloader settings
    YOUTUBE_COOKIES_BROWSER: Optional[str] = os.getenv("YOUTUBE_COOKIES_BROWSER", "none")  # none | chrome | firefox | edge | brave
    COOKIES_FILE_PATH: Path = DATA_DIR / "cookies.txt"
    ERROR_LOG_PATH: Path = DATA_DIR / "pipeline_errors.log"
    NODE_PATH: Optional[str] = os.getenv("NODE_PATH", None)

    # Social OAuth
    YOUTUBE_CLIENT_ID: Optional[str] = os.getenv("YOUTUBE_CLIENT_ID")
    YOUTUBE_CLIENT_SECRET: Optional[str] = os.getenv("YOUTUBE_CLIENT_SECRET")
    YOUTUBE_REDIRECT_URI: str = "http://localhost:3000/api/auth/callback/youtube"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Ensure directories exist
for p in [settings.UPLOAD_DIR, settings.PROXY_DIR, settings.EXPORT_DIR, settings.CACHE_DIR]:
    p.mkdir(parents=True, exist_ok=True)
