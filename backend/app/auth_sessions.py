"""Server-side refresh sessions with rotating opaque tokens."""
import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy import DateTime, ForeignKey, String, select
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from .models import Base

class RefreshSession(Base):
    __tablename__="refresh_sessions"
    id:Mapped[uuid.UUID]=mapped_column(UUID(as_uuid=True),primary_key=True,default=uuid.uuid4)
    user_id:Mapped[uuid.UUID]=mapped_column(ForeignKey("users.id",ondelete="CASCADE"),index=True)
    token_hash:Mapped[str]=mapped_column(String(64),unique=True,index=True)
    expires_at:Mapped[datetime]=mapped_column(DateTime(timezone=True))
    revoked_at:Mapped[datetime|None]=mapped_column(DateTime(timezone=True))

def digest(token:str)->str:
    return hashlib.sha256(token.encode()).hexdigest()

async def new_refresh(db:AsyncSession,user_id:uuid.UUID)->str:
    token=secrets.token_urlsafe(48)
    db.add(RefreshSession(user_id=user_id,token_hash=digest(token),
                          expires_at=datetime.now(timezone.utc)+timedelta(days=30)))
    await db.flush()
    return token

async def rotate_refresh(db:AsyncSession,token:str)->tuple[uuid.UUID,str]:
    row=await db.scalar(select(RefreshSession).where(RefreshSession.token_hash==digest(token)).with_for_update())
    if not row or row.revoked_at or row.expires_at<=datetime.now(timezone.utc):
        raise HTTPException(401,"Invalid refresh session")
    row.revoked_at=datetime.now(timezone.utc)
    replacement=await new_refresh(db,row.user_id)
    await db.flush()
    return row.user_id,replacement

async def revoke_refresh(db:AsyncSession,token:str)->None:
    row=await db.scalar(select(RefreshSession).where(RefreshSession.token_hash==digest(token)).with_for_update())
    if row:row.revoked_at=datetime.now(timezone.utc)
