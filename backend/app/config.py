from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

BACKEND_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = BACKEND_DIR / "sindhudrishti.db"

class Settings(BaseSettings):
    APP_NAME: str = "SindhuDrishti API"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = f"sqlite+aiosqlite:///{DEFAULT_DB_PATH}"
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://0.0.0.0:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]
    UPLOAD_DIR: str = "./uploads"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True
    )

settings = Settings()
