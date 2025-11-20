from pydantic_settings import BaseSettings
from typing import List
from pathlib import Path


class Settings(BaseSettings):
    sambanova_api_key: str
    sambanova_base_url: str

    class Config:
        env_file = Path(__file__).parent.parent.parent.parent / ".env"
        case_sensitive = False


settings = Settings()
