from fastapi import APIRouter,Depends
from pydantic import BaseModel,Field
from sqlalchemy.ext.asyncio import AsyncSession
from .db import session
from .models import User
from .security import current_user,issue_access_token
from .auth_sessions import new_refresh,rotate_refresh,revoke_refresh

router=APIRouter(prefix="/v1/auth",tags=["auth"])

class TokenRequest(BaseModel):
    refresh_token:str=Field(min_length=40,max_length=256)

@router.post("/refresh")
async def refresh(payload:TokenRequest,db:AsyncSession=Depends(session)):
    user_id,token=await rotate_refresh(db,payload.refresh_token)
    await db.commit()
    return {"access_token":issue_access_token(user_id),"refresh_token":token,
            "token_type":"bearer","expires_in":900}

@router.post("/logout")
async def logout(payload:TokenRequest,user:User=Depends(current_user),db:AsyncSession=Depends(session)):
    # Only revoke tokens for the authenticated account.
    from .auth_sessions import RefreshSession,digest
    from sqlalchemy import select
    row=await db.scalar(select(RefreshSession).where(
        RefreshSession.token_hash==digest(payload.refresh_token),
        RefreshSession.user_id==user.id).with_for_update())
    if row:
        from datetime import datetime,timezone
        row.revoked_at=datetime.now(timezone.utc)
    await db.commit()
    return {"revoked":True}
