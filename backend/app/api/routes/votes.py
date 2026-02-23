from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Vote
from app.db.session import get_db_session
from app.schemas.vote import VoteRead

router = APIRouter(prefix="/votes", tags=["votes"])


@router.get("", response_model=list[VoteRead])
async def get_all_votes(db: AsyncSession = Depends(get_db_session)) -> list[Vote]:
    stmt = select(Vote).order_by(Vote.created_at.asc())
    return list((await db.execute(stmt)).scalars().all())
