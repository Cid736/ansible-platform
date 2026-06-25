from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.host import Host
from app.models.inventory import Inventory
from app.models.user import User
from app.schemas.host import HostCreate, HostUpdate, HostOut
from app.core.deps import get_current_user

router = APIRouter(prefix="/api/inventories/{inventory_id}/hosts", tags=["hosts"])


def _get_inventory(inventory_id: int, db: Session, user: User) -> Inventory:
    inv = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory not found")
    if inv.owner_id != user.id and not user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return inv


@router.get("/", response_model=List[HostOut])
def list_hosts(
    inventory_id: int,
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_inventory(inventory_id, db, current_user)
    return db.query(Host).filter(Host.inventory_id == inventory_id).offset(skip).limit(limit).all()


@router.post("/", response_model=HostOut, status_code=201)
def create_host(
    inventory_id: int,
    payload: HostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_inventory(inventory_id, db, current_user)
    host = Host(**payload.model_dump(), inventory_id=inventory_id)
    db.add(host)
    db.commit()
    db.refresh(host)
    return host


@router.get("/{host_id}", response_model=HostOut)
def get_host(
    inventory_id: int,
    host_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_inventory(inventory_id, db, current_user)
    host = db.query(Host).filter(Host.id == host_id, Host.inventory_id == inventory_id).first()
    if not host:
        raise HTTPException(status_code=404, detail="Host not found")
    return host


@router.put("/{host_id}", response_model=HostOut)
def update_host(
    inventory_id: int,
    host_id: int,
    payload: HostUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_inventory(inventory_id, db, current_user)
    host = db.query(Host).filter(Host.id == host_id, Host.inventory_id == inventory_id).first()
    if not host:
        raise HTTPException(status_code=404, detail="Host not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(host, field, value)
    db.commit()
    db.refresh(host)
    return host


@router.delete("/{host_id}", status_code=204)
def delete_host(
    inventory_id: int,
    host_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_inventory(inventory_id, db, current_user)
    host = db.query(Host).filter(Host.id == host_id, Host.inventory_id == inventory_id).first()
    if not host:
        raise HTTPException(status_code=404, detail="Host not found")
    db.delete(host)
    db.commit()
