from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class HostCreate(BaseModel):
    name: str
    address: str
    port: int = 22
    variables: Optional[str] = None
    description: Optional[str] = None
    enabled: bool = True
    group_name: Optional[str] = "all"


class HostUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    port: Optional[int] = None
    variables: Optional[str] = None
    description: Optional[str] = None
    enabled: Optional[bool] = None
    group_name: Optional[str] = None


class HostOut(BaseModel):
    id: int
    name: str
    address: str
    port: int
    variables: Optional[str]
    description: Optional[str]
    enabled: bool
    group_name: Optional[str]
    inventory_id: int
    created_at: datetime

    class Config:
        from_attributes = True
