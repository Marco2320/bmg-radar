"""initial schema

Revision ID: 20260223_0001
Revises:
Create Date: 2026-02-23 10:45:00
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "20260223_0001"
down_revision: str | None = None
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


user_role = postgresql.ENUM("employee", "ar", name="user_role", create_type=False)
submission_status = postgresql.ENUM("New", "Reviewed", "Passed", "Shortlisted", name="submission_status", create_type=False)
platform = postgresql.ENUM(
    "Spotify",
    "YouTube",
    "TikTok",
    "Instagram",
    "Apple Music",
    "SoundCloud",
    "Bandcamp",
    "Other",
    name="platform",
    create_type=False,
)


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    user_role.create(op.get_bind(), checkfirst=True)
    submission_status.create(op.get_bind(), checkfirst=True)
    platform.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("role", user_role, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_users")),
        sa.UniqueConstraint("email", name=op.f("uq_users_email")),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.create_table(
        "submissions",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("artist_name", sa.String(length=180), nullable=False),
        sa.Column("territory", sa.String(length=80), nullable=False),
        sa.Column("genre", sa.String(length=80), nullable=False),
        sa.Column("custom_genre", sa.String(length=120), nullable=True),
        sa.Column("rationale", sa.Text(), nullable=False),
        sa.Column("submitted_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", submission_status, server_default="New", nullable=False),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["submitted_by"], ["users.id"], name=op.f("fk_submissions_submitted_by_users"), ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_submissions")),
    )
    op.create_index(op.f("ix_submissions_artist_name"), "submissions", ["artist_name"], unique=False)
    op.create_index(op.f("ix_submissions_created_at"), "submissions", ["created_at"], unique=False)
    op.create_index(op.f("ix_submissions_genre"), "submissions", ["genre"], unique=False)
    op.create_index(op.f("ix_submissions_status"), "submissions", ["status"], unique=False)
    op.create_index(op.f("ix_submissions_submitted_by"), "submissions", ["submitted_by"], unique=False)
    op.create_index(op.f("ix_submissions_territory"), "submissions", ["territory"], unique=False)
    op.create_index("ix_submissions_feed", "submissions", ["status", "territory", "genre", "created_at"], unique=False)

    op.create_table(
        "submission_links",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("submission_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("platform", platform, nullable=False),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["submission_id"], ["submissions.id"], name=op.f("fk_submission_links_submission_id_submissions"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_submission_links")),
        sa.UniqueConstraint("submission_id", "platform", "url", name="uq_submission_link_platform_url"),
    )
    op.create_index(op.f("ix_submission_links_submission_id"), "submission_links", ["submission_id"], unique=False)

    op.create_table(
        "votes",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("submission_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["submission_id"], ["submissions.id"], name=op.f("fk_votes_submission_id_submissions"), ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_votes_user_id_users"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_votes")),
        sa.UniqueConstraint("submission_id", "user_id", name="uq_vote_submission_user"),
    )
    op.create_index(op.f("ix_votes_created_at"), "votes", ["created_at"], unique=False)
    op.create_index(op.f("ix_votes_submission_id"), "votes", ["submission_id"], unique=False)
    op.create_index("ix_votes_submission_created_at", "votes", ["submission_id", "created_at"], unique=False)
    op.create_index(op.f("ix_votes_user_id"), "votes", ["user_id"], unique=False)

    op.create_table(
        "comments",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("submission_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("comment_text", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["submission_id"], ["submissions.id"], name=op.f("fk_comments_submission_id_submissions"), ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_comments_user_id_users"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_comments")),
    )
    op.create_index(op.f("ix_comments_created_at"), "comments", ["created_at"], unique=False)
    op.create_index(op.f("ix_comments_submission_id"), "comments", ["submission_id"], unique=False)
    op.create_index("ix_comments_submission_created_at", "comments", ["submission_id", "created_at"], unique=False)
    op.create_index(op.f("ix_comments_user_id"), "comments", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_comments_user_id"), table_name="comments")
    op.drop_index("ix_comments_submission_created_at", table_name="comments")
    op.drop_index(op.f("ix_comments_submission_id"), table_name="comments")
    op.drop_index(op.f("ix_comments_created_at"), table_name="comments")
    op.drop_table("comments")

    op.drop_index(op.f("ix_votes_user_id"), table_name="votes")
    op.drop_index("ix_votes_submission_created_at", table_name="votes")
    op.drop_index(op.f("ix_votes_submission_id"), table_name="votes")
    op.drop_index(op.f("ix_votes_created_at"), table_name="votes")
    op.drop_table("votes")

    op.drop_index(op.f("ix_submission_links_submission_id"), table_name="submission_links")
    op.drop_table("submission_links")

    op.drop_index("ix_submissions_feed", table_name="submissions")
    op.drop_index(op.f("ix_submissions_territory"), table_name="submissions")
    op.drop_index(op.f("ix_submissions_submitted_by"), table_name="submissions")
    op.drop_index(op.f("ix_submissions_status"), table_name="submissions")
    op.drop_index(op.f("ix_submissions_genre"), table_name="submissions")
    op.drop_index(op.f("ix_submissions_created_at"), table_name="submissions")
    op.drop_index(op.f("ix_submissions_artist_name"), table_name="submissions")
    op.drop_table("submissions")

    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")

    platform.drop(op.get_bind(), checkfirst=True)
    submission_status.drop(op.get_bind(), checkfirst=True)
    user_role.drop(op.get_bind(), checkfirst=True)
