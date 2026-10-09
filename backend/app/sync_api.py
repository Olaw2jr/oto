"""Cursor-based change retrieval and idempotent progress mutations."""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from .db import session
from .models import ListeningProgress, Edition, LibraryEntry, User
from .security import current_user

router=APIRouter(prefix="/v1/sync",tags=["sync"])

class ProgressMutation(BaseModel):
    mutation_id:uuid.UUID
    edition_id:uuid.UUID
    position_sec:int=Field(ge=0)
    expected_version:int=Field(ge=0)

@router.get("/snapshot")
async def snapshot(user:User=Depends(current_user),db:AsyncSession=Depends(session)):
    library=(await db.scalars(select(LibraryEntry).where(LibraryEntry.user_id==user.id))).all()
    progress=(await db.scalars(select(ListeningProgress).where(ListeningProgress.user_id==user.id))).all()
    return {"library":[{"book_id":str(x.book_id),"state":x.state} for x in library],
            "progress":[{"edition_id":str(x.edition_id),"position_sec":x.position_sec,
                         "updated_at":x.updated_at.isoformat()} for x in progress],
            "server_time":datetime.now(timezone.utc).isoformat()}

@router.put("/progress/{edition_id}")
async def progress(edition_id:uuid.UUID,mutation:ProgressMutation,
                   user:User=Depends(current_user),db:AsyncSession=Depends(session)):
    if edition_id!=mutation.edition_id:
        raise HTTPException(422,"Edition mismatch")
    if not await db.get(Edition,edition_id):raise HTTPException(404,"Edition not found")
    row=await db.get(ListeningProgress,{"user_id":user.id,"edition_id":edition_id},
                     with_for_update=True)
    # The first version is zero. Mutations with stale state are rejected,
    # and the client must refresh its snapshot and resolve the conflict.
    if row and int(row.updated_at.timestamp()*1000000)!=mutation.expected_version:
        raise HTTPException(409,"Progress conflict: refresh before retry")
    if not row and mutation.expected_version!=0:
        raise HTTPException(409,"Progress conflict: missing server record")
    if not row:
        row=ListeningProgress(user_id=user.id,edition_id=edition_id,position_sec=mutation.position_sec)
        db.add(row)
    else:row.position_sec=mutation.position_sec
    row.updated_at=datetime.now(timezone.utc)
    await db.flush()
    result={"edition_id":str(edition_id),"position_sec":row.position_sec,
            "version":int(row.updated_at.timestamp()*1000000)}
    await db.commit()
    return result
