from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class JobCreate(BaseModel):
    name: Optional[str] = None
    playbook_id: int
    inventory_id: int
    credential_id: int
    extra_vars: Optional[str] = None
    limit: Optional[str] = None
    verbosity: int = 0


class JobOut(BaseModel):
    id: int
    name: Optional[str]
    status: str
    playbook_id: int
    inventory_id: int
    credential_id: int
    extra_vars: Optional[str]
    limit: Optional[str]
    verbosity: int
    return_code: Optional[int]
    started_at: Optional[datetime]
    finished_at: Optional[datetime]
    celery_task_id: Optional[str]
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class JobDetail(JobOut):
    output: Optional[str]
