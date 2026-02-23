from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class CommentRead(BaseModel):
    id: UUID
    submission_id: UUID
    user_id: UUID
    comment_text: str
    created_at: datetime


class CommentCreate(BaseModel):
    user_id: UUID
    comment_text: str = Field(min_length=1, max_length=5000)


class CommentCountResponse(BaseModel):
    count: int
