from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.job import Job
from app.models.inventory import Inventory
from app.models.playbook import Playbook
from app.models.credential import Credential
from app.models.user import User
from app.core.deps import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    def count(model, **filters):
        q = db.query(model)
        if not current_user.is_superuser and hasattr(model, "owner_id"):
            q = q.filter(model.owner_id == current_user.id)
        for k, v in filters.items():
            q = q.filter(getattr(model, k) == v)
        return q.count()

    recent_jobs = (
        db.query(Job)
        .filter(Job.owner_id == current_user.id if not current_user.is_superuser else True)
        .order_by(Job.created_at.desc())
        .limit(5)
        .all()
    )

    return {
        "total_inventories": count(Inventory),
        "total_playbooks": count(Playbook),
        "total_credentials": count(Credential),
        "jobs_total": count(Job),
        "jobs_running": count(Job, status="running"),
        "jobs_success": count(Job, status="success"),
        "jobs_failed": count(Job, status="failed"),
        "recent_jobs": [
            {
                "id": j.id,
                "name": j.name,
                "status": j.status,
                "created_at": j.created_at.isoformat() if j.created_at else None,
            }
            for j in recent_jobs
        ],
    }
