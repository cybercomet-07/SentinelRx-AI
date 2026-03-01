from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# .env is in backend/ - resolve path so it's always found regardless of cwd
_ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"


class Settings(BaseSettings):
    app_name: str = "SentinelRx-AI Backend"
    app_env: str = "development"
    api_v1_prefix: str = "/api/v1"
    database_url: str

    n8n_webhook_url: str | None = None
    openai_api_key: str | None = None
    gemini_api_key: str | None = None
    groq_api_key: str | None = None
    cohere_api_key: str | None = None
    openrouter_api_key: str | None = None
    langfuse_public_key: str | None = None
    langfuse_secret_key: str | None = None
    langfuse_base_url: str = "https://cloud.langfuse.com"
    brevo_api_key: str | None = None
    deepseek_api_key: str | None = None
    razorpay_key_id: str | None = None
    razorpay_key_secret: str | None = None
    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    google_client_id: str | None = None
    cors_origins: str = "http://localhost:3000,http://localhost:5173,http://localhost:3001,http://localhost:3002,http://localhost:3005,http://localhost:3006,http://localhost:3007,http://127.0.0.1:3000,http://127.0.0.1:5173,http://127.0.0.1:3001,http://127.0.0.1:3002,http://127.0.0.1:3005,http://127.0.0.1:3006,http://127.0.0.1:3007"

    model_config = SettingsConfigDict(env_file=str(_ENV_PATH), env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()
