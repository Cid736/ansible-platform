from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.playbook import Playbook
from app.models.user import User
from app.schemas.playbook import PlaybookCreate, PlaybookUpdate, PlaybookOut, PlaybookDetail
from app.core.deps import get_current_user
from app.services.ansible import _safe_playbook_filename

router = APIRouter(prefix="/api/playbooks", tags=["playbooks"])


def _get_playbook(pb_id: int, db: Session, user: User) -> Playbook:
    pb = db.query(Playbook).filter(Playbook.id == pb_id).first()
    if not pb:
        raise HTTPException(status_code=404, detail="Playbook not found")
    if pb.owner_id != user.id and not user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return pb


def _validated_filename(raw: str) -> str:
    """Raise HTTP 422 if the filename is unsafe."""
    try:
        return _safe_playbook_filename(raw)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@router.get("/", response_model=List[PlaybookOut])
def list_playbooks(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Playbook)
    if not current_user.is_superuser:
        q = q.filter(Playbook.owner_id == current_user.id)
    return q.offset(skip).limit(limit).all()


@router.post("/", response_model=PlaybookDetail, status_code=201)
def create_playbook(
    payload: PlaybookCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    raw_filename = payload.filename or f"{payload.name.lower().replace(' ', '_')}.yml"
    filename = _validated_filename(raw_filename)
    pb = Playbook(
        name=payload.name,
        description=payload.description,
        content=payload.content,
        filename=filename,
        owner_id=current_user.id,
    )
    db.add(pb)
    db.commit()
    db.refresh(pb)
    return pb


@router.post("/upload", response_model=PlaybookDetail, status_code=201)
async def upload_playbook(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    content = (await file.read()).decode("utf-8")
    raw_filename = file.filename or "playbook.yml"
    filename = _validated_filename(raw_filename)
    pb_name = name or filename.replace(".yml", "").replace(".yaml", "")
    pb = Playbook(
        name=pb_name,
        description=description,
        content=content,
        filename=filename,
        owner_id=current_user.id,
    )
    db.add(pb)
    db.commit()
    db.refresh(pb)
    return pb


@router.get("/{pb_id}", response_model=PlaybookDetail)
def get_playbook(
    pb_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_playbook(pb_id, db, current_user)


@router.put("/{pb_id}", response_model=PlaybookDetail)
def update_playbook(
    pb_id: int,
    payload: PlaybookUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pb = _get_playbook(pb_id, db, current_user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(pb, field, value)
    db.commit()
    db.refresh(pb)
    return pb


@router.delete("/{pb_id}", status_code=204)
def delete_playbook(
    pb_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pb = _get_playbook(pb_id, db, current_user)
    db.delete(pb)
    db.commit()
