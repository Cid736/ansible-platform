from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.inventory import Inventory
from app.models.user import User
from app.schemas.inventory import InventoryCreate, InventoryUpdate, InventoryOut, InventoryDetail
from app.core.deps import get_current_user

router = APIRouter(prefix="/api/inventories", tags=["inventories"])


def _get_inventory(inventory_id: int, db: Session, user: User) -> Inventory:
    inv = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory not found")
    if inv.owner_id != user.id and not user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return inv


@router.get("/", response_model=List[InventoryOut])
def list_inventories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Inventory)
    if not current_user.is_superuser:
        q = q.filter(Inventory.owner_id == current_user.id)
    inventories = q.offset(skip).limit(limit).all()
    result = []
    for inv in inventories:
        d = InventoryOut.model_validate(inv)
        d.host_count = len(inv.hosts)
        result.append(d)
    return result


@router.post("/", response_model=InventoryOut, status_code=201)
def create_inventory(
    payload: InventoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    inv = Inventory(**payload.model_dump(), owner_id=current_user.id)
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return inv


@router.get("/{inventory_id}", response_model=InventoryDetail)
def get_inventory(
    inventory_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    inv = _get_inventory(inventory_id, db, current_user)
    d = InventoryDetail.model_validate(inv)
    d.host_count = len(inv.hosts)
    return d


@router.put("/{inventory_id}", response_model=InventoryOut)
def update_inventory(
    inventory_id: int,
    payload: InventoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    inv = _get_inventory(inventory_id, db, current_user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(inv, field, value)
    db.commit()
    db.refresh(inv)
    return inv


@router.delete("/{inventory_id}", status_code=204)
def delete_inventory(
    inventory_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    inv = _get_inventory(inventory_id, db, current_user)
    db.delete(inv)
    db.commit()
