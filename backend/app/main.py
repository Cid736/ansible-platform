import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.config import settings
from app.routers import auth, users, inventories, hosts, credentials, playbooks, jobs, dashboard

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    _seed_superuser()
    yield


def _seed_superuser():
    from app.models.user import User
    from app.core.security import hash_password

    db: Session = SessionLocal()
    try:
        existing = db.query(User).filter(User.username == settings.FIRST_SUPERUSER).first()
        if not existing:
            user = User(
                username=settings.FIRST_SUPERUSER,
                email=settings.FIRST_SUPERUSER_EMAIL,
                hashed_password=hash_password(settings.FIRST_SUPERUSER_PASSWORD),
                is_superuser=True,
                is_active=True,
            )
            db.add(user)
            db.commit()
    finally:
        db.close()


# Restrict allowed origins.  Set CORS_ORIGINS env var to a comma-separated list
# of your front-end origins (e.g. "https://ansible.example.com").
# Wildcards are NOT permitted when credentials are included (RFC 6454 / Fetch spec).
_raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000")
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app = FastAPI(
    title="Ansible Platform",
    description="AWX-like platform for Ansible automation",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(inventories.router)
app.include_router(hosts.router)
app.include_router(credentials.router)
app.include_router(playbooks.router)
app.include_router(jobs.router)
app.include_router(dashboard.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
