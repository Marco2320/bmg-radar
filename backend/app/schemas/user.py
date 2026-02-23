from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.db.models import UserRole


class UserRead(BaseModel):
    id: UUID
    name: str
    email: str
    role: UserRole
    created_at: datetime


class UserCreate(BaseModel):
    name: str
    email: str
    role: UserRole
