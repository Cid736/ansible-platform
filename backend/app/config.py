from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://ansible:ansible@db:5432/ansible_platform"
    # SECRET_KEY must be set via environment variable / .env — no insecure default.
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ENCRYPTION_KEY must be set via environment variable / .env — no insecure default.
    ENCRYPTION_KEY: str

    REDIS_URL: str = "redis://redis:6379/0"

    ANSIBLE_PROJECTS_DIR: str = "/ansible/projects"
    ANSIBLE_ARTIFACTS_DIR: str = "/ansible/artifacts"

    FIRST_SUPERUSER: str = "admin"
    FIRST_SUPERUSER_EMAIL: str = "admin@example.com"
    # Must be overridden via environment variable; no weak default allowed.
    FIRST_SUPERUSER_PASSWORD: str

    # Set to False to disable the public self-registration endpoint.
    ALLOW_REGISTRATION: bool = False

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
