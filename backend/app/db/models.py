from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, Text, UniqueConstraint, func, text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def _enum_values(enum_cls: type[StrEnum]) -> list[str]:
    return [member.value for member in enum_cls]


class UserRole(StrEnum):
    EMPLOYEE = "employee"
    AR = "ar"


class Platform(StrEnum):
    SPOTIFY = "Spotify"
    YOUTUBE = "YouTube"
    TIKTOK = "TikTok"
    INSTAGRAM = "Instagram"
    APPLE_MUSIC = "Apple Music"
    SOUNDCLOUD = "SoundCloud"
    BANDCAMP = "Bandcamp"
    OTHER = "Other"


class SubmissionStatus(StrEnum):
    NEW = "New"
    REVIEWED = "Reviewed"
    PASSED = "Passed"
    SHORTLISTED = "Shortlisted"


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=text("gen_random_uuid()"),
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", native_enum=True, values_callable=_enum_values),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    submissions: Mapped[list[Submission]] = relationship(back_populates="submitter")
    votes: Mapped[list[Vote]] = relationship(back_populates="user", cascade="all, delete-orphan")
    comments: Mapped[list[Comment]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=text("gen_random_uuid()"),
    )
    artist_name: Mapped[str] = mapped_column(String(180), nullable=False, index=True)
    territory: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    genre: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    custom_genre: Mapped[str | None] = mapped_column(String(120), nullable=True)
    rationale: Mapped[str] = mapped_column(Text, nullable=False)
    submitted_by: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    status: Mapped[SubmissionStatus] = mapped_column(
        Enum(SubmissionStatus, name="submission_status", native_enum=True, values_callable=_enum_values),
        nullable=False,
        default=SubmissionStatus.NEW,
        server_default=SubmissionStatus.NEW.value,
        index=True,
    )
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    submitter: Mapped[User] = relationship(back_populates="submissions")
    links: Mapped[list[SubmissionLink]] = relationship(back_populates="submission", cascade="all, delete-orphan")
    votes: Mapped[list[Vote]] = relationship(back_populates="submission", cascade="all, delete-orphan")
    comments: Mapped[list[Comment]] = relationship(back_populates="submission", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_submissions_feed", "status", "territory", "genre", "created_at"),
    )


class SubmissionLink(Base):
    __tablename__ = "submission_links"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=text("gen_random_uuid()"),
    )
    submission_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("submissions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    platform: Mapped[Platform] = mapped_column(
        Enum(Platform, name="platform", native_enum=True, values_callable=_enum_values),
        nullable=False,
    )
    url: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    submission: Mapped[Submission] = relationship(back_populates="links")

    __table_args__ = (
        UniqueConstraint("submission_id", "platform", "url", name="uq_submission_link_platform_url"),
    )


class Vote(Base):
    __tablename__ = "votes"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=text("gen_random_uuid()"),
    )
    submission_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("submissions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)

    submission: Mapped[Submission] = relationship(back_populates="votes")
    user: Mapped[User] = relationship(back_populates="votes")

    __table_args__ = (
        UniqueConstraint("submission_id", "user_id", name="uq_vote_submission_user"),
        Index("ix_votes_submission_created_at", "submission_id", "created_at"),
    )


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=text("gen_random_uuid()"),
    )
    submission_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("submissions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    comment_text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)

    submission: Mapped[Submission] = relationship(back_populates="comments")
    user: Mapped[User] = relationship(back_populates="comments")

    __table_args__ = (
        Index("ix_comments_submission_created_at", "submission_id", "created_at"),
    )
