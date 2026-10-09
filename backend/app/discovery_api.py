"""Deterministic catalogue search and relationship-aware discovery."""
import uuid
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select, func, desc, or_
from sqlalchemy.ext.asyncio import AsyncSession
from .db import session
from .models import Book, LibraryEntry, Follow, User, SocialEvent
from .social_models import Review
from .security import current_user

router=APIRouter(prefix="/v1", tags=["discovery"])

def item(book, rating=None):
    return {"id": str(book.id), "title": book.title, "subtitle": book.subtitle,
            "cover_url": book.cover_url, "language": book.language,
            "rating": float(rating) if rating is not None else None}

@router.get("/discover")
async def discover(limit:int=Query(20,ge=1,le=100),offset:int=Query(0,ge=0),
                   language:str|None=Query(None,max_length=16),db:AsyncSession=Depends(session)):
    score=func.avg(Review.rating).label("rating")
    count=func.count(Review.id).label("reviews")
    stmt=select(Book,score,count).outerjoin(Review,Review.book_id==Book.id)
    if language:stmt=stmt.where(Book.language==language)
    stmt=stmt.group_by(Book.id).order_by(desc(count),desc(score),Book.title,Book.id)
    rows=(await db.execute(stmt.limit(limit).offset(offset))).all()
    return {"items":[{**item(book,rating),"review_count":n} for book,rating,n in rows],
            "limit":limit,"offset":offset}

@router.get("/search")
async def search(q:str=Query(min_length=1,max_length=200),limit:int=Query(20,ge=1,le=100),
                 offset:int=Query(0,ge=0),db:AsyncSession=Depends(session)):
    escaped=q.strip().replace("\\","\\\\").replace("%","\\%").replace("_","\\_")
    stmt=select(Book).where(or_(Book.title.ilike(f"%{escaped}%",escape="\\"),
         Book.subtitle.ilike(f"%{escaped}%",escape="\\"))).order_by(Book.title,Book.id)
    books=(await db.scalars(stmt.offset(offset).limit(limit))).all()
    return {"items":[item(book) for book in books],"limit":limit,"offset":offset}

@router.get("/me/discover")
async def personal_discover(user:User=Depends(current_user),db:AsyncSession=Depends(session),
                            limit:int=Query(20,ge=1,le=100)):
    follows=select(Follow.followed_id).where(Follow.follower_id==user.id)
    owned=select(LibraryEntry.book_id).where(LibraryEntry.user_id==user.id)
    stmt=(select(Book,func.count(SocialEvent.id).label("score"))
          .join(SocialEvent,SocialEvent.book_id==Book.id)
          .where(SocialEvent.actor_id.in_(follows),Book.id.not_in(owned))
          .group_by(Book.id).order_by(desc("score"),Book.id).limit(limit))
    rows=(await db.execute(stmt)).all()
    return {"items":[{**item(book),"social_score":count} for book,count in rows]}
