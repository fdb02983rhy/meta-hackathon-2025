from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    sambanova_api_key: str
    sambanova_base_url: str
    google_api_key: str

    class Config:
        env_file = Path(__file__).parent.parent.parent.parent / ".env"
        case_sensitive = False


settings = Settings()

# Session Configuration
MAX_SESSION_AGE_HOURS = 1
MAX_SESSIONS = 100
