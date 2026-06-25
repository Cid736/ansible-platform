from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=True)
    status = Column(String(32), default="pending", nullable=False)
    playbook_id = Column(Integer, ForeignKey("playbooks.id"), nullable=False)
    inventory_id = Column(Integer, ForeignKey("inventories.id"), nullable=False)
    credential_id = Column(Integer, ForeignKey("credentials.id"), nullable=False)
    extra_vars = Column(Text, nullable=True)
    limit = Column(String(255), nullable=True)
    verbosity = Column(Integer, default=0, nullable=False)
    output = Column(Text, nullable=True)
    return_code = Column(Integer, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    celery_task_id = Column(String(255), nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    owner = relationship("User", back_populates="jobs")
    playbook = relationship("Playbook", back_populates="jobs")
    inventory = relationship("Inventory", back_populates="jobs")
    credential = relationship("Credential", back_populates="jobs")
