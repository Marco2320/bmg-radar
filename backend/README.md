# BMG Radar Backend (FastAPI + PostgreSQL)

This backend is the production data layer for BMG Radar. It is designed for real project usage (schema constraints, migrations, indexes, transactional writes), not mock-only prototyping.

## Stack

- FastAPI
- PostgreSQL 16
- SQLAlchemy 2.0 (async)
- Alembic migrations

## Domain Coverage

- Users (`employee`, `ar`)
- Submissions
- Submission links (platform URLs)
- Votes (one vote per user per submission)
- Comments

## Local Setup

1. Start PostgreSQL:

```bash
cd /Users/Marco/Documents/New\ project/backend
docker compose up -d postgres
```

2. Create virtual environment and install dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

3. Configure environment:

```bash
cp .env.example .env
```

4. Run migrations:

```bash
alembic upgrade head
```

5. (Optional) seed users and demo data:

```bash
PYTHONPATH=. python -m scripts.seed --with-demo-data
```

6. Run API:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Open docs at `http://localhost:8000/docs`.

## API Contract (store.ts parity)

- `GET /api/v1/submissions`
- `GET /api/v1/submissions/{id}`
- `POST /api/v1/submissions`
- `PATCH /api/v1/submissions/{id}/status`
- `GET /api/v1/submissions/{id}/votes`
- `GET /api/v1/submissions/{id}/votes/count`
- `GET /api/v1/submissions/{id}/votes/has-voted?user_id=...`
- `POST /api/v1/submissions/{id}/votes/toggle`
- `GET /api/v1/submissions/{id}/comments`
- `GET /api/v1/submissions/{id}/comments/count`
- `POST /api/v1/submissions/{id}/comments`
- `GET /api/v1/users`
- `GET /api/v1/users/{id}`
- `POST /api/v1/users`
- `GET /api/v1/votes`

## Scalability Notes

- UUID primary keys across all tables.
- Explicit FK constraints and cascading deletes for child entities.
- Unique constraints where correctness requires it (email, vote uniqueness).
- Feed-oriented indexes for status/territory/genre/created_at filtering and sorting.
- Vote/comment time-series indexes for trending and analytics.
- Alembic migration baseline so schema evolves safely over time.
