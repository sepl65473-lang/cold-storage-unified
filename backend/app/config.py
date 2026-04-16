from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # ── App ──────────────────────────────────────────────────────────────────
    ENVIRONMENT: Literal["development", "test", "production"] = "development"
    SECRET_KEY: str = "change-me-in-production"
    DEBUG: bool = False

    # ── Database ──────────────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres_dev_password@db:5432/cold_storage_dev"
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10

    # ── Redis / Celery ────────────────────────────────────────────────────────
    REDIS_URL: str = "redis://:redis_dev_password@redis:6379/0"
    CELERY_BROKER_URL: str = ""
    CELERY_RESULT_BACKEND: str = ""

    def model_post_init(self, __context: object) -> None:
        if not self.CELERY_BROKER_URL:
            object.__setattr__(self, "CELERY_BROKER_URL", self.REDIS_URL)
        if not self.CELERY_RESULT_BACKEND:
            object.__setattr__(self, "CELERY_RESULT_BACKEND", self.REDIS_URL)

    # ── JWT ───────────────────────────────────────────────────────────────────
    JWT_PRIVATE_KEY: str = ""
    JWT_PUBLIC_KEY: str = ""
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── MQTT ──────────────────────────────────────────────────────────────────
    MQTT_BROKER_HOST: str = "mosquitto"
    MQTT_BROKER_PORT: int = 1883
    MQTT_USE_TLS: bool = False

    # ── CORS ──────────────────────────────────────────────────────────────────
    # NOTE: With `allow_credentials=True`, browsers will reject wildcard origins ("*").
    # These defaults are for local development; override via env in production.
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    # ── Alert Thresholds ──────────────────────────────────────────────────────
    TEMP_MAX_C: float = 8.0
    TEMP_MIN_C: float = 2.0
    BATTERY_LOW_PCT: float = 20.0
    DOOR_OPEN_MAX_SECONDS: int = 300
    OFFLINE_TIMEOUT_SECONDS: int = 300

    # ── Email (SES) ───────────────────────────────────────────────────────────
    CONTACT_RECIPIENT_EMAIL: str = "sepl65473@gmail.com"
    AWS_REGION: str = "us-east-1"

    # ── IoT Ingestion ──────────────────────────────────────────────────────────
    IOT_INGEST_TOKEN: str = "dev_iot_token_123"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings: Settings = get_settings()
