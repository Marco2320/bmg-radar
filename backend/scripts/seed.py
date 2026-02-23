from __future__ import annotations

import argparse
import asyncio

from sqlalchemy import func, select

from app.db.models import Comment, Platform, Submission, SubmissionLink, SubmissionStatus, User, UserRole, Vote
from app.db.session import SessionLocal

USERS = [
    {"name": "Sarah Chen", "email": "sarah.chen@bmg.com", "role": UserRole.EMPLOYEE},
    {"name": "Marcus Webb", "email": "marcus.webb@bmg.com", "role": UserRole.AR},
    {"name": "Laura Muller", "email": "laura.muller@bmg.com", "role": UserRole.EMPLOYEE},
    {"name": "James Okafor", "email": "james.okafor@bmg.com", "role": UserRole.EMPLOYEE},
]


async def seed_users() -> dict[str, User]:
    async with SessionLocal() as db:
        users_by_email: dict[str, User] = {}
        for payload in USERS:
            existing = (await db.execute(select(User).where(User.email == payload["email"]))).scalar_one_or_none()
            if existing is None:
                existing = User(**payload)
                db.add(existing)
                await db.flush()
            users_by_email[payload["email"]] = existing

        await db.commit()
        return users_by_email


async def seed_demo_data(users_by_email: dict[str, User]) -> None:
    async with SessionLocal() as db:
        existing = (await db.execute(select(func.count(Submission.id)))).scalar_one()
        if existing > 0:
            print("Demo submissions already exist, skipping demo seed.")
            return

        sarah = users_by_email["sarah.chen@bmg.com"]
        marcus = users_by_email["marcus.webb@bmg.com"]
        laura = users_by_email["laura.muller@bmg.com"]
        james = users_by_email["james.okafor@bmg.com"]

        s1 = Submission(
            artist_name="Mira Voss",
            territory="DACH",
            genre="Electronic/Dance",
            rationale="Strong streaming growth in DACH region.",
            submitted_by=sarah.id,
            status=SubmissionStatus.NEW,
            links=[
                SubmissionLink(platform=Platform.SPOTIFY, url="https://open.spotify.com/artist/mira-voss"),
                SubmissionLink(platform=Platform.TIKTOK, url="https://www.tiktok.com/@miravoss"),
            ],
        )

        s2 = Submission(
            artist_name="Kofi Mensah",
            territory="Africa",
            genre="Afrobeats",
            rationale="Viral single with UK crossover.",
            submitted_by=james.id,
            status=SubmissionStatus.REVIEWED,
            links=[
                SubmissionLink(platform=Platform.YOUTUBE, url="https://www.youtube.com/@kofimensah"),
                SubmissionLink(platform=Platform.SPOTIFY, url="https://open.spotify.com/artist/kofi-mensah"),
            ],
        )

        db.add_all([s1, s2])
        await db.flush()

        db.add_all(
            [
                Vote(submission_id=s1.id, user_id=laura.id),
                Vote(submission_id=s1.id, user_id=james.id),
                Vote(submission_id=s2.id, user_id=sarah.id),
                Vote(submission_id=s2.id, user_id=marcus.id),
                Comment(submission_id=s1.id, user_id=laura.id, comment_text="Great stage energy."),
                Comment(submission_id=s2.id, user_id=marcus.id, comment_text="Worth a deeper A&R review."),
            ]
        )

        await db.commit()
        print("Demo data seeded.")


async def main(with_demo_data: bool) -> None:
    users_by_email = await seed_users()
    print(f"Seeded/verified {len(users_by_email)} users.")
    if with_demo_data:
        await seed_demo_data(users_by_email)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed BMG Radar data")
    parser.add_argument("--with-demo-data", action="store_true", help="Insert demo submissions, votes and comments")
    args = parser.parse_args()

    asyncio.run(main(with_demo_data=args.with_demo_data))
