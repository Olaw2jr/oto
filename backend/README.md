# Oto headless backend (foundation PR)

FastAPI + async SQLAlchemy + PostgreSQL system of record + Neo4j projections.
This directory introduces a backend boundary alongside the existing TypeScript
providers; it **does not** yet switch the mobile app to the new API.

## Run locally

From `backend/`:

```bash
docker compose up -d
python -m venv .venv
. .venv/bin/activate
pip install -e '.[test]'
export DATABASE_URL=postgresql+asyncpg://oto:oto@localhost:5432/oto
export NEO4J_URI=bolt://localhost:7687
export NEO4J_USER=neo4j
export NEO4J_PASSWORD=change-me
export JWT_SECRET='replace-with-a-random-string-of-at-least-32-characters'
export OAUTH_GOOGLE_CLIENT_ID='the-client-id-used-by-your-native-google-sign-in'
alembic upgrade head
uvicorn app.main:app --reload
```

In a second terminal, run `python -m app.graph` to project committed social
and library events into Neo4j. API docs are at `http://localhost:8000/docs`.
Run `pytest` from `backend/`.

## Model and ownership

* `books` holds canonical works, `book_identifiers` stores ISBN/OLID/etc.
* `contributors` and `book_contributors` represent attributed people.
* `editions` are distinct narrated/published renditions of a canonical work.
* `provider_records` retain stable provider IDs, raw data and provenance.
* `audio_sources` connect an edition with an originating provider record and
  carry rights status, territories, format, source kind and source trust.
* `users`, `oauth_identities`, `library_entries`, `listening_progress`,
  `follows` and `social_events` remain authoritative in PostgreSQL.
* `outbox_events` is the transactionally committed graph projection queue.
  Event replay is safe because Cypher uses MERGE and relationship deletion is
  idempotent. Outbox delivery is at least once.

## API implemented

* `POST /v1/auth/google` verifies a Google ID token and returns a 15-minute
  Oto bearer token; native clients obtain their Google ID token using a secure
  OAuth flow with PKCE.
* `GET /v1/me`, `GET /v1/books?q=&limit=&offset=`,
  `GET /v1/books/{id}`, `GET /v1/editions/{id}/sources`.
* `GET /v1/me/library`, `PUT /v1/me/library/{book_id}`.
* `GET|PUT /v1/me/progress/{edition_id}`.
* `PUT|DELETE /v1/users/{id}/follow`, `POST /v1/social/events`.

Sources with unknown rights are not published to client playback APIs.
This foundation currently limits source exposure to world-wide approved
records; a later PR must use request-context jurisdiction and a hardened
playback proxy with short-lived signed URLs.

## Follow-up integration sequence

1. Port the TypeScript `MetadataProvider`, `AudioCatalogueProvider` and
   `AssetProvider` abstractions into Python with fakes and contract tests.
2. Port Open Library, Google Books, LibriVox and Internet Archive adapters.
   Preserve source-level provenance and verify provider rules and rights.
3. Build a canonical matching pipeline using identifiers, title/author
   normalisation and an auditable merge queue. Do not merge by title alone.
4. Build edition/source ingestion, background refresh workers, scheduling,
   idempotency and source health evaluation. AudiobookBay metadata integration
   must remain subject to site access terms and rights checks.
5. Add Apple social sign-in, refresh token rotation/revocation, token key
   rotation, account linking, account deletion and session management.
6. Expose full shelves, collections, clubs, reviews, ratings, likes, activity
   feed, following, notifications, recommendations, discovery, profile and
   search APIs backed by the PostgreSQL record and Neo4j projections.
7. Move mobile screens off seed state via typed API clients, preserving
   offline-first persistence, mutations and conflict resolution.
8. Add moderation, privacy settings, safety controls, RBAC, telemetry,
   graph rebuild, migration verification, rate limits and load tests.

The initial migration creates the whole schema; future migrations should use
explicit Alembic operations. Do not use sample development credentials in
production or expose Neo4j and PostgreSQL to the public internet.
