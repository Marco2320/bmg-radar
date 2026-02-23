from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import Select, desc, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import Comment, Submission, SubmissionLink, SubmissionStatus, User, Vote
from app.db.session import get_db_session
from app.schemas.comment import CommentCountResponse, CommentCreate, CommentRead
from app.schemas.submission import (
    SortOrder,
    SubmissionCreate,
    SubmissionListItem,
    SubmissionListResponse,
    SubmissionRead,
    SubmissionStatusUpdate,
)
from app.schemas.vote import HasVotedResponse, VoteCountResponse, VoteRead, VoteToggleRequest, VoteToggleResponse

router = APIRouter(prefix="/submissions", tags=["submissions"])


async def _require_submission(db: AsyncSession, submission_id: UUID) -> Submission:
    submission = await db.get(Submission, submission_id)
    if submission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
    return submission


async def _require_user(db: AsyncSession, user_id: UUID) -> User:
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


def _apply_submission_filters(
    stmt: Select,
    territory: str | None,
    genre: str | None,
    status_filter: SubmissionStatus | None,
) -> Select:
    if territory:
        stmt = stmt.where(Submission.territory == territory)
    if genre:
        stmt = stmt.where(Submission.genre == genre)
    if status_filter:
        stmt = stmt.where(Submission.status == status_filter)
    return stmt


@router.get("", response_model=SubmissionListResponse)
async def list_submissions(
    territory: str | None = Query(default=None),
    genre: str | None = Query(default=None),
    status_filter: SubmissionStatus | None = Query(default=None, alias="status"),
    sort: SortOrder = Query(default="newest"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    db: AsyncSession = Depends(get_db_session),
) -> SubmissionListResponse:
    vote_counts_sq = (
        select(Vote.submission_id.label("submission_id"), func.count(Vote.id).label("vote_count"))
        .group_by(Vote.submission_id)
        .subquery()
    )
    comment_counts_sq = (
        select(Comment.submission_id.label("submission_id"), func.count(Comment.id).label("comment_count"))
        .group_by(Comment.submission_id)
        .subquery()
    )

    count_stmt = _apply_submission_filters(select(func.count()).select_from(Submission), territory, genre, status_filter)
    total = (await db.execute(count_stmt)).scalar_one()

    stmt = (
        select(
            Submission,
            func.coalesce(vote_counts_sq.c.vote_count, 0).label("vote_count"),
            func.coalesce(comment_counts_sq.c.comment_count, 0).label("comment_count"),
        )
        .outerjoin(vote_counts_sq, vote_counts_sq.c.submission_id == Submission.id)
        .outerjoin(comment_counts_sq, comment_counts_sq.c.submission_id == Submission.id)
        .options(selectinload(Submission.links))
    )
    stmt = _apply_submission_filters(stmt, territory, genre, status_filter)

    if sort == "most_upvoted":
        stmt = stmt.order_by(desc("vote_count"), Submission.created_at.desc())
    else:
        stmt = stmt.order_by(Submission.created_at.desc())

    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(stmt)).all()

    items = []
    for submission, vote_count, comment_count in rows:
        base = SubmissionRead.model_validate(submission, from_attributes=True)
        items.append(SubmissionListItem(**base.model_dump(), vote_count=vote_count, comment_count=comment_count))

    return SubmissionListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/{submission_id}", response_model=SubmissionRead)
async def get_submission(submission_id: UUID, db: AsyncSession = Depends(get_db_session)) -> SubmissionRead:
    stmt = select(Submission).options(selectinload(Submission.links)).where(Submission.id == submission_id)
    submission = (await db.execute(stmt)).scalar_one_or_none()
    if submission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
    return SubmissionRead.model_validate(submission, from_attributes=True)


@router.post("", response_model=SubmissionRead, status_code=status.HTTP_201_CREATED)
async def add_submission(payload: SubmissionCreate, db: AsyncSession = Depends(get_db_session)) -> SubmissionRead:
    await _require_user(db, payload.submitted_by)

    submission = Submission(
        artist_name=payload.artist_name,
        territory=payload.territory,
        genre=payload.genre,
        custom_genre=payload.custom_genre,
        rationale=payload.rationale,
        submitted_by=payload.submitted_by,
        status=SubmissionStatus.NEW,
        image_url=str(payload.image_url) if payload.image_url else None,
    )

    for link in payload.links:
        submission.links.append(SubmissionLink(platform=link.platform, url=str(link.url)))

    db.add(submission)
    await db.commit()
    await db.refresh(submission, attribute_names=["links"])
    return SubmissionRead.model_validate(submission, from_attributes=True)


@router.patch("/{submission_id}/status", status_code=status.HTTP_204_NO_CONTENT)
async def update_submission_status(
    submission_id: UUID,
    payload: SubmissionStatusUpdate,
    db: AsyncSession = Depends(get_db_session),
) -> None:
    submission = await _require_submission(db, submission_id)
    submission.status = payload.status
    await db.commit()


@router.get("/{submission_id}/votes", response_model=list[VoteRead])
async def get_votes(submission_id: UUID, db: AsyncSession = Depends(get_db_session)) -> list[Vote]:
    await _require_submission(db, submission_id)
    stmt = select(Vote).where(Vote.submission_id == submission_id).order_by(Vote.created_at.asc())
    return list((await db.execute(stmt)).scalars().all())


@router.get("/{submission_id}/votes/count", response_model=VoteCountResponse)
async def get_vote_count(submission_id: UUID, db: AsyncSession = Depends(get_db_session)) -> VoteCountResponse:
    await _require_submission(db, submission_id)
    count = (await db.execute(select(func.count(Vote.id)).where(Vote.submission_id == submission_id))).scalar_one()
    return VoteCountResponse(count=count)


@router.get("/{submission_id}/votes/has-voted", response_model=HasVotedResponse)
async def has_voted(submission_id: UUID, user_id: UUID, db: AsyncSession = Depends(get_db_session)) -> HasVotedResponse:
    await _require_submission(db, submission_id)
    await _require_user(db, user_id)
    stmt = select(Vote.id).where(Vote.submission_id == submission_id, Vote.user_id == user_id)
    has_vote = (await db.execute(stmt)).scalar_one_or_none() is not None
    return HasVotedResponse(has_voted=has_vote)


@router.post("/{submission_id}/votes/toggle", response_model=VoteToggleResponse)
async def toggle_vote(
    submission_id: UUID,
    payload: VoteToggleRequest,
    db: AsyncSession = Depends(get_db_session),
) -> VoteToggleResponse:
    await _require_submission(db, submission_id)
    await _require_user(db, payload.user_id)

    stmt = select(Vote).where(Vote.submission_id == submission_id, Vote.user_id == payload.user_id)
    existing = (await db.execute(stmt)).scalar_one_or_none()

    if existing is not None:
        await db.delete(existing)
        voted = False
    else:
        db.add(Vote(submission_id=submission_id, user_id=payload.user_id))
        voted = True

    try:
        await db.commit()
    except IntegrityError:
        # Concurrent toggle requests can race on the unique vote constraint.
        await db.rollback()
        voted = True

    count = (await db.execute(select(func.count(Vote.id)).where(Vote.submission_id == submission_id))).scalar_one()
    return VoteToggleResponse(voted=voted, vote_count=count)


@router.get("/{submission_id}/comments", response_model=list[CommentRead])
async def get_comments(submission_id: UUID, db: AsyncSession = Depends(get_db_session)) -> list[Comment]:
    await _require_submission(db, submission_id)
    stmt = select(Comment).where(Comment.submission_id == submission_id).order_by(Comment.created_at.asc())
    return list((await db.execute(stmt)).scalars().all())


@router.get("/{submission_id}/comments/count", response_model=CommentCountResponse)
async def get_comment_count(submission_id: UUID, db: AsyncSession = Depends(get_db_session)) -> CommentCountResponse:
    await _require_submission(db, submission_id)
    count = (await db.execute(select(func.count(Comment.id)).where(Comment.submission_id == submission_id))).scalar_one()
    return CommentCountResponse(count=count)


@router.post("/{submission_id}/comments", response_model=CommentRead, status_code=status.HTTP_201_CREATED)
async def add_comment(
    submission_id: UUID,
    payload: CommentCreate,
    db: AsyncSession = Depends(get_db_session),
) -> Comment:
    await _require_submission(db, submission_id)
    await _require_user(db, payload.user_id)

    comment = Comment(submission_id=submission_id, user_id=payload.user_id, comment_text=payload.comment_text)
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    return comment
