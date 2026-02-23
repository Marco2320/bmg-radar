from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, HttpUrl

from app.db.models import Platform, SubmissionStatus


SortOrder = Literal["newest", "most_upvoted"]


class SubmissionLinkRead(BaseModel):
    id: UUID
    submission_id: UUID
    platform: Platform
    url: str
    created_at: datetime


class SubmissionLinkCreate(BaseModel):
    platform: Platform
    url: HttpUrl


class SubmissionCreate(BaseModel):
    artist_name: str = Field(min_length=1, max_length=180)
    territory: str = Field(min_length=1, max_length=80)
    genre: str = Field(min_length=1, max_length=80)
    custom_genre: str | None = Field(default=None, max_length=120)
    rationale: str = Field(min_length=1, max_length=10000)
    submitted_by: UUID
    image_url: HttpUrl | None = None
    links: list[SubmissionLinkCreate] = Field(min_length=1, max_length=20)


class SubmissionRead(BaseModel):
    id: UUID
    artist_name: str
    territory: str
    genre: str
    custom_genre: str | None
    rationale: str
    submitted_by: UUID
    status: SubmissionStatus
    created_at: datetime
    updated_at: datetime
    image_url: str | None
    links: list[SubmissionLinkRead]


class SubmissionListItem(SubmissionRead):
    vote_count: int
    comment_count: int


class SubmissionListResponse(BaseModel):
    items: list[SubmissionListItem]
    total: int
    page: int
    page_size: int


class SubmissionStatusUpdate(BaseModel):
    status: SubmissionStatus
