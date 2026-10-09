"""Versioned headless API. No database schema changes occur at app startup."""
import uuid
from fastapi import Depends, FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from .db import session
from .models import (
    Book, Edition, AudioSource, ProviderRecord, OAuthIdentity, User,
    LibraryEntry, ListeningProgress, Follow, SocialEvent, OutboxEvent,
)
from .security import current_user, verify_google_id_token, issue_access_token

app = FastAPI(title="Oto Headless API", version="0.1.0")

class GoogleLogin(BaseModel):
    id_token: str = Field(min_length=20)

class ProgressWrite(BaseModel):
    position_sec: int = Field(ge=0)

class SocialPost(BaseModel):
    kind: str = Field(pattern=r"^(review|activity)$")
    book_id: uuid.UUID | None = None
    body: str = Field(min_length=1, max_length=4000)

def book_payload(book: Book) -> dict:
    return {
        "id": str(book.id), "title": book.title, "subtitle": book.subtitle,
        "description": book.description, "language": book.language,
        "cover_url": book.cover_url,
    }

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/v1/auth/google")
async def google_login(payload: GoogleLogin, db: AsyncSession = Depends(session)):
    identity = await verify_google_id_token(payload.id_token)
    subject = identity["sub"]
    linked = await db.scalar(select(OAuthIdentity).where(
        OAuthIdentity.provider == "google", OAuthIdentity.subject == subject
    ))
    if linked:
        user = await db.get(User, linked.user_id)
    else:
        # Handles are never derived from untrusted display names or email addresses.
        user = User(handle=f"user_{uuid.uuid4().hex[:20]}",
                    display_name=identity.get("name", "Reader"),
                    avatar_url=identity.get("picture"))
        db.add(user)
        await db.flush()
        db.add(OAuthIdentity(user_id=user.id, provider="google", subject=subject))
    await db.commit()
    return {"access_token": issue_access_token(user.id), "token_type": "bearer", "expires_in": 900}

@app.get("/v1/me")
async def me(user: User = Depends(current_user)):
    return {"id": str(user.id), "handle": user.handle,
            "display_name": user.display_name, "avatar_url": user.avatar_url}

@app.get("/v1/books")
async def books(q: str = Query(default="", max_length=200),
                limit: int = Query(default=20, ge=1, le=100),
                offset: int = Query(default=0, ge=0),
                db: AsyncSession = Depends(session)):
    stmt = select(Book).order_by(Book.title, Book.id).offset(offset).limit(limit)
    if q.strip():
        stmt = stmt.where(Book.title.ilike(f"%{q.strip()}%"))
    return {"items": [book_payload(b) for b in (await db.scalars(stmt)).all()],
            "limit": limit, "offset": offset}

@app.get("/v1/books/{book_id}")
async def book_detail(book_id: uuid.UUID, db: AsyncSession = Depends(session)):
    book = await db.get(Book, book_id)
    if book is None:
        raise HTTPException(404, "Book not found")
    editions = (await db.scalars(select(Edition).where(Edition.book_id == book_id))).all()
    result = book_payload(book)
    result["editions"] = [{
        "id": str(e.id), "narrators": e.narrators, "language": e.language,
        "duration_sec": e.duration_sec, "chapters": e.chapters
    } for e in editions]
    return result

@app.get("/v1/editions/{edition_id}/sources")
async def edition_sources(edition_id: uuid.UUID,
                          user: User = Depends(current_user),
                          db: AsyncSession = Depends(session)):
    """Never expose unknown-rights or untrusted sources to clients."""
    edition = await db.get(Edition, edition_id)
    if edition is None:
        raise HTTPException(404, "Edition not found")
    rows = (await db.scalars(select(AudioSource).where(
        AudioSource.edition_id == edition_id,
        AudioSource.rights_status.in_(("public-domain", "licensed")),
        AudioSource.trusted_source_id.is_not(None),
    ))).all()
    return {"items": [{
        "id": str(s.id), "kind": s.kind, "format": s.format, "uri": s.location
    } for s in rows if not s.rights_territories or "WORLD" in s.rights_territories]}

@app.get("/v1/me/library")
async def my_library(user: User = Depends(current_user), db: AsyncSession = Depends(session)):
    rows = (await db.execute(select(Book, LibraryEntry.state).join(
        LibraryEntry, LibraryEntry.book_id == Book.id
    ).where(LibraryEntry.user_id == user.id).order_by(LibraryEntry.added_at.desc()))).all()
    return {"items": [{**book_payload(book), "state": state} for book, state in rows]}

@app.put("/v1/me/library/{book_id}")
async def save_book(book_id: uuid.UUID, user: User = Depends(current_user),
                    db: AsyncSession = Depends(session)):
    if await db.get(Book, book_id) is None:
        raise HTTPException(404, "Book not found")
    key = {"user_id": user.id, "book_id": book_id}
    if await db.get(LibraryEntry, key) is None:
        db.add(LibraryEntry(**key))
        db.add(OutboxEvent(topic="library.saved", payload={
            "user_id": str(user.id), "book_id": str(book_id)}))
    await db.commit()
    return {"saved": True}

@app.put("/v1/me/progress/{edition_id}")
async def update_progress(edition_id: uuid.UUID, payload: ProgressWrite,
                          user: User = Depends(current_user),
                          db: AsyncSession = Depends(session)):
    if await db.get(Edition, edition_id) is None:
        raise HTTPException(404, "Edition not found")
    key = {"user_id": user.id, "edition_id": edition_id}
    row = await db.get(ListeningProgress, key)
    if row:
        row.position_sec = payload.position_sec
    else:
        db.add(ListeningProgress(**key, position_sec=payload.position_sec))
    await db.commit()
    return {"edition_id": str(edition_id), "position_sec": payload.position_sec}

@app.get("/v1/me/progress/{edition_id}")
async def get_progress(edition_id: uuid.UUID, user: User = Depends(current_user),
                       db: AsyncSession = Depends(session)):
    row = await db.get(ListeningProgress, {"user_id": user.id, "edition_id": edition_id})
    return {"edition_id": str(edition_id), "position_sec": row.position_sec if row else 0}

@app.put("/v1/users/{user_id}/follow")
async def follow(user_id: uuid.UUID, user: User = Depends(current_user),
                 db: AsyncSession = Depends(session)):
    if user_id == user.id:
        raise HTTPException(400, "Cannot follow yourself")
    if await db.get(User, user_id) is None:
        raise HTTPException(404, "User not found")
    if await db.get(Follow, {"follower_id": user.id, "followed_id": user_id}) is None:
        db.add(Follow(follower_id=user.id, followed_id=user_id))
        db.add(OutboxEvent(topic="social.followed", payload={
            "follower_id": str(user.id), "followed_id": str(user_id)}))
    await db.commit()
    return {"following": True}

@app.delete("/v1/users/{user_id}/follow")
async def unfollow(user_id: uuid.UUID, user: User = Depends(current_user),
                   db: AsyncSession = Depends(session)):
    edge = await db.get(Follow, {"follower_id": user.id, "followed_id": user_id})
    if edge:
        await db.delete(edge)
        db.add(OutboxEvent(topic="social.unfollowed", payload={
            "follower_id": str(user.id), "followed_id": str(user_id)}))
    await db.commit()
    return {"following": False}

@app.post("/v1/social/events", status_code=201)
async def post_event(payload: SocialPost, user: User = Depends(current_user),
                     db: AsyncSession = Depends(session)):
    if payload.book_id and await db.get(Book, payload.book_id) is None:
        raise HTTPException(404, "Book not found")
    event = SocialEvent(actor_id=user.id, kind=payload.kind, body=payload.body,
                        book_id=payload.book_id)
    db.add(event)
    await db.flush()
    db.add(OutboxEvent(topic="social.event", payload={
        "id": str(event.id), "actor_id": str(user.id),
        "book_id": str(payload.book_id) if payload.book_id else None,
        "kind": payload.kind}))
    await db.commit()
    return {"id": str(event.id)}
