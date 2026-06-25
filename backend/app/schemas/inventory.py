from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.host import HostOut


class InventoryCreate(BaseModel):
    name: str
    description: Optional[str] = None


class InventoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class InventoryOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    owner_id: int
    created_at: datetime
    updated_at: datetime
    host_count: Optional[int] = 0

    class Config:
        from_attributes = True


class InventoryDetail(InventoryOut):
    hosts: List[HostOut] = []
