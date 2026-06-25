from celery import Celery
from app.config import settings
from app.database import SessionLocal

celery_app = Celery("ansible_platform", broker=settings.REDIS_URL, backend=settings.REDIS_URL)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
)


@celery_app.task(bind=True, name="run_ansible_job")
def run_ansible_job(self, job_id: int) -> dict:
    from app.services.ansible import run_job

    db = SessionLocal()
    try:
        run_job(job_id, db)
        return {"job_id": job_id, "status": "done"}
    finally:
        db.close()
