from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.config import settings
from app.routers import auth, users, inventories, hosts, credentials, playbooks, jobs, dashboard


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


app = FastAPI(
    title="Ansible Platform",
    description="AWX-like platform for Ansible automation",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
