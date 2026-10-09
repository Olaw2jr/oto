import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from .db import session
from .models import Book, User, Follow, SocialEvent, OutboxEvent
from .social_models import Shelf, ShelfBook, Review, Club, ClubMember, Like
from .security import current_user

router=APIRouter(prefix="/v1",tags=["social"])

class ShelfCreate(BaseModel):
    name: str = Field(min_length=1,max_length=120)
    is_public: bool = False

class ReviewWrite(BaseModel):
    rating: int = Field(ge=1,le=5)
    body: str = Field(default="",max_length=4000)

class ClubCreate(BaseModel):
    name: str = Field(min_length=1,max_length=140)
    description: str = Field(default="",max_length=2000)

@router.post("/me/shelves",status_code=201)
async def create_shelf(data:ShelfCreate, user:User=Depends(current_user), db:AsyncSession=Depends(session)):
    shelf=Shelf(owner_id=user.id,name=data.name.strip(),is_public=data.is_public)
    db.add(shelf)
    await db.flush()
    result={"id":str(shelf.id),"name":shelf.name,"is_public":shelf.is_public}
    await db.commit()
    return result

@router.get("/me/shelves")
async def shelves(user:User=Depends(current_user),db:AsyncSession=Depends(session)):
    rows=(await db.scalars(select(Shelf).where(Shelf.owner_id==user.id).order_by(Shelf.name))).all()
    return {"items":[{"id":str(s.id),"name":s.name,"is_public":s.is_public} for s in rows]}

@router.put("/me/shelves/{shelf_id}/books/{book_id}")
async def shelf_add(shelf_id:uuid.UUID,book_id:uuid.UUID,user:User=Depends(current_user),db:AsyncSession=Depends(session)):
    shelf=await db.get(Shelf,shelf_id)
    if not shelf or shelf.owner_id!=user.id:raise HTTPException(404,"Shelf not found")
    if not await db.get(Book,book_id):raise HTTPException(404,"Book not found")
    if not await db.get(ShelfBook,{"shelf_id":shelf_id,"book_id":book_id}):
        db.add(ShelfBook(shelf_id=shelf_id,book_id=book_id))
        await db.commit()
    return {"saved":True}

@router.put("/books/{book_id}/review")
async def review_book(book_id:uuid.UUID,data:ReviewWrite,user:User=Depends(current_user),db:AsyncSession=Depends(session)):
    if not await db.get(Book,book_id):raise HTTPException(404,"Book not found")
    row=await db.scalar(select(Review).where(Review.user_id==user.id,Review.book_id==book_id))
    if row:row.rating,row.body=data.rating,data.body
    else:
        row=Review(user_id=user.id,book_id=book_id,rating=data.rating,body=data.body)
        db.add(row)
    db.add(OutboxEvent(topic="social.reviewed",payload={"user_id":str(user.id),"book_id":str(book_id)}))
    await db.commit()
    return {"rating":data.rating,"book_id":str(book_id)}

@router.get("/books/{book_id}/reviews")
async def book_reviews(book_id:uuid.UUID,limit:int=Query(20,ge=1,le=100),db:AsyncSession=Depends(session)):
    rows=(await db.scalars(select(Review).where(Review.book_id==book_id).order_by(desc(Review.created_at)).limit(limit))).all()
    return {"items":[{"user_id":str(r.user_id),"rating":r.rating,"body":r.body} for r in rows]}

@router.post("/clubs",status_code=201)
async def create_club(data:ClubCreate,user:User=Depends(current_user),db:AsyncSession=Depends(session)):
    club=Club(owner_id=user.id,name=data.name,description=data.description)
    db.add(club)
    await db.flush()
    db.add(ClubMember(club_id=club.id,user_id=user.id,role="owner"))
    await db.commit()
    return {"id":str(club.id),"name":club.name}

@router.post("/clubs/{club_id}/join")
async def join_club(club_id:uuid.UUID,user:User=Depends(current_user),db:AsyncSession=Depends(session)):
    if not await db.get(Club,club_id):raise HTTPException(404,"Club not found")
    if not await db.get(ClubMember,{"club_id":club_id,"user_id":user.id}):
        db.add(ClubMember(club_id=club_id,user_id=user.id))
        db.add(OutboxEvent(topic="social.club_joined",payload={"club_id":str(club_id),"user_id":str(user.id)}))
        await db.commit()
    return {"joined":True}

@router.get("/feed")
async def following_feed(user:User=Depends(current_user),db:AsyncSession=Depends(session),
                         limit:int=Query(30,ge=1,le=100)):
    followed=select(Follow.followed_id).where(Follow.follower_id==user.id)
    rows=(await db.scalars(select(SocialEvent).where(SocialEvent.actor_id.in_(followed))
          .order_by(desc(SocialEvent.created_at),desc(SocialEvent.id)).limit(limit))).all()
    return {"items":[{"id":str(r.id),"actor_id":str(r.actor_id),"book_id":str(r.book_id) if r.book_id else None,
                       "kind":r.kind,"body":r.body,"created_at":r.created_at.isoformat()} for r in rows]}

@router.put("/social/events/{event_id}/like")
async def like_event(event_id:uuid.UUID,user:User=Depends(current_user),db:AsyncSession=Depends(session)):
    if not await db.get(SocialEvent,event_id):raise HTTPException(404,"Event not found")
    if not await db.get(Like,{"event_id":event_id,"user_id":user.id}):
        db.add(Like(event_id=event_id,user_id=user.id))
        await db.commit()
    return {"liked":True}
