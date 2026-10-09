"""Social records in PostgreSQL; graph remains a derived index."""
import uuid
from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from .models import Base

class Shelf(Base):
    __tablename__ = "shelves"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)
    __table_args__ = (UniqueConstraint("owner_id","name"),)

class ShelfBook(Base):
    __tablename__ = "shelf_books"
    shelf_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("shelves.id",ondelete="CASCADE"),primary_key=True)
    book_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("books.id",ondelete="CASCADE"),primary_key=True)

class Review(Base):
    __tablename__ = "reviews"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id",ondelete="CASCADE"),index=True)
    book_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("books.id",ondelete="CASCADE"),index=True)
    rating: Mapped[int] = mapped_column(Integer)
    body: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True),server_default=func.now())
    __table_args__ = (UniqueConstraint("user_id","book_id"),)

class Club(Base):
    __tablename__ = "clubs"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id",ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(140))
    description: Mapped[str] = mapped_column(Text, default="")

class ClubMember(Base):
    __tablename__ = "club_members"
    club_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clubs.id",ondelete="CASCADE"),primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id",ondelete="CASCADE"),primary_key=True)
    role: Mapped[str] = mapped_column(String(20),default="member")

class Like(Base):
    __tablename__ = "event_likes"
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id",ondelete="CASCADE"),primary_key=True)
    event_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("social_events.id",ondelete="CASCADE"),primary_key=True)
