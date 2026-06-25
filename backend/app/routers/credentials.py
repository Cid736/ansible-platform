from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.credential import Credential
from app.models.user import User
from app.schemas.credential import CredentialCreate, CredentialUpdate, CredentialOut
from app.core.deps import get_current_user
from app.services.encryption import encrypt

router = APIRouter(prefix="/api/credentials", tags=["credentials"])


def _get_credential(cred_id: int, db: Session, user: User) -> Credential:
    cred = db.query(Credential).filter(Credential.id == cred_id).first()
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")
    if cred.owner_id != user.id and not user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return cred


@router.get("/", response_model=List[CredentialOut])
def list_credentials(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Credential)
    if not current_user.is_superuser:
        q = q.filter(Credential.owner_id == current_user.id)
    return q.offset(skip).limit(limit).all()


@router.post("/", response_model=CredentialOut, status_code=201)
def create_credential(
    payload: CredentialCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cred = Credential(
        name=payload.name,
        description=payload.description,
        credential_type=payload.credential_type,
        username=payload.username,
        become_method=payload.become_method,
        become_username=payload.become_username,
        owner_id=current_user.id,
    )
    if payload.password:
        cred.password_enc = encrypt(payload.password)
    if payload.ssh_key:
        cred.ssh_key_enc = encrypt(payload.ssh_key)
    if payload.become_password:
        cred.become_password_enc = encrypt(payload.become_password)
    db.add(cred)
    db.commit()
    db.refresh(cred)
    return cred


@router.get("/{cred_id}", response_model=CredentialOut)
def get_credential(
    cred_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_credential(cred_id, db, current_user)


@router.put("/{cred_id}", response_model=CredentialOut)
def update_credential(
    cred_id: int,
    payload: CredentialUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cred = _get_credential(cred_id, db, current_user)
    if payload.name is not None:
        cred.name = payload.name
    if payload.description is not None:
        cred.description = payload.description
    if payload.username is not None:
        cred.username = payload.username
    if payload.password is not None:
        cred.password_enc = encrypt(payload.password)
    if payload.ssh_key is not None:
        cred.ssh_key_enc = encrypt(payload.ssh_key)
    if payload.become_method is not None:
        cred.become_method = payload.become_method
    if payload.become_username is not None:
        cred.become_username = payload.become_username
    if payload.become_password is not None:
        cred.become_password_enc = encrypt(payload.become_password)
    db.commit()
    db.refresh(cred)
    return cred


@router.delete("/{cred_id}", status_code=204)
def delete_credential(
    cred_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cred = _get_credential(cred_id, db, current_user)
    db.delete(cred)
    db.commit()
