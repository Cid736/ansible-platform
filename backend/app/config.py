from pydantic_settings import BaseSettings
from typing import Optional
import secrets


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://ansible:ansible@db:5432/ansible_platform"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    ENCRYPTION_KEY: Optional[str] = None

    REDIS_URL: str = "redis://redis:6379/0"

    ANSIBLE_PROJECTS_DIR: str = "/ansible/projects"
    ANSIBLE_ARTIFACTS_DIR: str = "/ansible/artifacts"

    FIRST_SUPERUSER: str = "admin"
    FIRST_SUPERUSER_EMAIL: str = "admin@example.com"
    FIRST_SUPERUSER_PASSWORD: str = "admin123"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
