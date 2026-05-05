"""Application configuration loaded from environment variables."""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    app_name: str = "Sahayak"
    debug: bool = False
    environment: str = "development"

    # Database
    database_url: str = "postgresql+asyncpg://sahayak:password@localhost:5432/sahayak"
    db_pool_size: int = 10
    db_max_overflow: int = 20

    # Redis
    redis_url: str = "redis://localhost:6379"
    cache_ttl_seconds: int = 21_600  # 6 hours

    # CORS
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Anthropic (optional)
    anthropic_api_key: str = ""

    # Groq (cloud LLM — recommended for production)
    groq_api_key: str = ""
    groq_model: str = "llama-3.1-70b-versatile"

    # Ollama (local LLM — for local dev without API keys)
    ollama_base_url: str = "http://host.docker.internal:11434"
    ollama_model: str = "llama3.2"

    llm_max_tokens: int = 2048

    # LLM provider: "groq" | "ollama"
    llm_provider: str = "ollama"

    # Pinecone
    pinecone_api_key: str = ""
    pinecone_index_name: str = "sahayak-schemes"
    pinecone_top_k: int = 8

    # Cohere
    cohere_api_key: str = ""
    cohere_rerank_model: str = "rerank-multilingual-v3.0"
    cohere_rerank_top_n: int = 3

    # Auth
    nextauth_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_days: int = 7

    # UIDAI
    uidai_aua_code: str = ""
    uidai_license_key: str = ""
    uidai_sandbox_url: str = "https://developer.uidai.gov.in"

    # DigiLocker
    digilocker_client_id: str = ""
    digilocker_client_secret: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
