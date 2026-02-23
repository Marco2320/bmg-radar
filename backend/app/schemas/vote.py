from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class VoteRead(BaseModel):
    id: UUID
    submission_id: UUID
    user_id: UUID
    created_at: datetime


class VoteToggleRequest(BaseModel):
    user_id: UUID


class VoteToggleResponse(BaseModel):
    voted: bool
    vote_count: int


class VoteCountResponse(BaseModel):
    count: int


class HasVotedResponse(BaseModel):
    has_voted: bool
