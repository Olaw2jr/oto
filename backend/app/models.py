"""PostgreSQL is authoritative. Graph edges are projections, never auth state."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, UniqueConstraint, Text, JSON
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

def utcnow():
    return datetime.now(timezone.utc)

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    handle: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(200))
    avatar_url: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

class OAuthIdentity(Base):
    __tablename__ = "oauth_identities"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    provider: Mapped[str] = mapped_column(String(40))
    subject: Mapped[str] = mapped_column(String(255))
    __table_args__ = (UniqueConstraint("provider", "subject"),)

class Book(Base):
    __tablename__ = "books"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(500), index=True)
    subtitle: Mapped[str | None] = mapped_column(String(500))
    description: Mapped[str | None] = mapped_column(Text)
    language: Mapped[str | None] = mapped_column(String(16))
    cover_url: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

class Contributor(Base):
    __tablename__ = "contributors"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(250), index=True)

class BookContributor(Base):
    __tablename__ = "book_contributors"
    book_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("books.id", ondelete="CASCADE"), primary_key=True)
    contributor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("contributors.id"), primary_key=True)
    role: Mapped[str] = mapped_column(String(32), primary_key=True, default="author")

class BookIdentifier(Base):
    __tablename__ = "book_identifiers"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    book_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("books.id", ondelete="CASCADE"))
    scheme: Mapped[str] = mapped_column(String(32))
    value: Mapped[str] = mapped_column(String(255))
    __table_args__ = (UniqueConstraint("scheme", "value"),)

class Edition(Base):
    __tablename__ = "editions"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    book_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("books.id", ondelete="CASCADE"), index=True)
    publisher: Mapped[str | None] = mapped_column(String(255))
    language: Mapped[str | None] = mapped_column(String(16))
    narrators: Mapped[list] = mapped_column(JSON, default=list)
    duration_sec: Mapped[int | None] = mapped_column(Integer)
    chapters: Mapped[list] = mapped_column(JSON, default=list)

class ProviderRecord(Base):
    __tablename__ = "provider_records"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    book_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("books.id", ondelete="CASCADE"), index=True)
    edition_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("editions.id", ondelete="SET NULL"))
    provider: Mapped[str] = mapped_column(String(100))
    external_id: Mapped[str] = mapped_column(String(500))
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    __table_args__ = (UniqueConstraint("provider", "external_id"),)

class AudioSource(Base):
    __tablename__ = "audio_sources"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    edition_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("editions.id", ondelete="CASCADE"), index=True)
    provider_record_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("provider_records.id"))
    kind: Mapped[str] = mapped_column(String(30))  # https, torrent, local, hls
    location: Mapped[str] = mapped_column(Text)
    format: Mapped[str | None] = mapped_column(String(20))
    rights_status: Mapped[str] = mapped_column(String(30), default="unknown")
    rights_territories: Mapped[list] = mapped_column(JSON, default=list)
    rights_evidence: Mapped[str | None] = mapped_column(Text)
    trusted_source_id: Mapped[str | None] = mapped_column(String(100))
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, default=dict)

class LibraryEntry(Base):
    __tablename__ = "library_entries"
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    book_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("books.id", ondelete="CASCADE"), primary_key=True)
    state: Mapped[str] = mapped_column(String(30), default="saved")
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

class ListeningProgress(Base):
    __tablename__ = "listening_progress"
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    edition_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("editions.id", ondelete="CASCADE"), primary_key=True)
    position_sec: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

class Follow(Base):
    __tablename__ = "follows"
    follower_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    followed_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

class SocialEvent(Base):
    __tablename__ = "social_events"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    actor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    book_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("books.id"))
    kind: Mapped[str] = mapped_column(String(40))
    body: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

class OutboxEvent(Base):
    __tablename__ = "outbox_events"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    topic: Mapped[str] = mapped_column(String(80))
    payload: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    __table_args__ = (Index("ix_outbox_pending", "delivered_at", "created_at"),)
