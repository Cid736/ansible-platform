from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Credential(Base):
    __tablename__ = "credentials"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    credential_type = Column(String(64), nullable=False)  # ssh_password | ssh_key | vault
    username = Column(String(255), nullable=True)
    password_enc = Column(Text, nullable=True)
    ssh_key_enc = Column(Text, nullable=True)
    become_method = Column(String(32), default="sudo", nullable=True)
    become_username = Column(String(255), nullable=True)
    become_password_enc = Column(Text, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    owner = relationship("User", back_populates="credentials")
    jobs = relationship("Job", back_populates="credential")
