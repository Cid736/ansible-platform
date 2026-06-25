from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PlaybookCreate(BaseModel):
    name: str
    description: Optional[str] = None
    content: str
    filename: Optional[str] = None


class PlaybookUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    filename: Optional[str] = None


class PlaybookOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    filename: str
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PlaybookDetail(PlaybookOut):
    content: str
