from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime


class CredentialCreate(BaseModel):
    name: str
    description: Optional[str] = None
    credential_type: Literal["ssh_password", "ssh_key", "vault"]
    username: Optional[str] = None
    password: Optional[str] = None
    ssh_key: Optional[str] = None
    become_method: Optional[str] = "sudo"
    become_username: Optional[str] = None
    become_password: Optional[str] = None


class CredentialUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    ssh_key: Optional[str] = None
    become_method: Optional[str] = None
    become_username: Optional[str] = None
    become_password: Optional[str] = None


class CredentialOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    credential_type: str
    username: Optional[str]
    become_method: Optional[str]
    become_username: Optional[str]
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True
