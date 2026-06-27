import asyncio
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db, SessionLocal
from app.models.job import Job
from app.models.user import User
from app.schemas.job import JobCreate, JobOut, JobDetail
from app.core.deps import get_current_user
from app.core.security import decode_token
from app.worker import run_ansible_job

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


def _get_job(job_id: int, db: Session, user: User) -> Job:
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.owner_id != user.id and not user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return job


@router.get("/", response_model=List[JobOut])
def list_jobs(
    skip: int = 0,
    limit: int = 50,
    status: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Job)
    if not current_user.is_superuser:
        q = q.filter(Job.owner_id == current_user.id)
    if status:
        q = q.filter(Job.status == status)
    return q.order_by(Job.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=JobOut, status_code=201)
def launch_job(
    payload: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = Job(
        name=payload.name,
        playbook_id=payload.playbook_id,
        inventory_id=payload.inventory_id,
        credential_id=payload.credential_id,
        extra_vars=payload.extra_vars,
        limit=payload.limit,
        verbosity=payload.verbosity,
        status="pending",
        owner_id=current_user.id,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    task = run_ansible_job.delay(job.id)
    job.celery_task_id = task.id
    db.commit()
    db.refresh(job)
    return job


@router.get("/{job_id}", response_model=JobDetail)
def get_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_job(job_id, db, current_user)


@router.post("/{job_id}/cancel", response_model=JobOut)
def cancel_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from celery.result import AsyncResult
    from app.worker import celery_app

    job = _get_job(job_id, db, current_user)
    if job.status not in ("pending", "running"):
        raise HTTPException(status_code=400, detail="Job is not running")
    if job.celery_task_id:
        AsyncResult(job.celery_task_id, app=celery_app).revoke(terminate=True)
    job.status = "canceled"
    db.commit()
    db.refresh(job)
    return job


@router.delete("/{job_id}", status_code=204)
def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = _get_job(job_id, db, current_user)
    db.delete(job)
    db.commit()


@router.websocket("/{job_id}/output")
async def job_output_ws(job_id: int, websocket: WebSocket, token: str = None):
    await websocket.accept()

    if not token:
        await websocket.close(code=1008)
        return

    payload = decode_token(token)
    if not payload:
        await websocket.close(code=1008)
        return

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == payload.get("sub")).first()
        if not user or not user.is_active:
            await websocket.close(code=1008)
            return

        job: Job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            await websocket.send_text("Job not found")
            await websocket.close()
            return

        # Authorisation: only the job owner or a superuser may stream output.
        if job.owner_id != user.id and not user.is_superuser:
            await websocket.close(code=1008)
            return

        sent_len = 0
        while True:
            db.refresh(job)
            output = job.output or ""
            if len(output) > sent_len:
                await websocket.send_text(output[sent_len:])
                sent_len = len(output)

            if job.status in ("success", "failed", "canceled"):
                await websocket.send_text(f"\n[STATUS: {job.status}]")
                break

            await asyncio.sleep(1)
    except WebSocketDisconnect:
        pass
    finally:
        db.close()
        try:
            await websocket.close()
        except Exception:
            pass
