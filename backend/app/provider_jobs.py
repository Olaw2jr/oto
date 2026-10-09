"""Explicit, bounded provider import runner for trusted offline worker use."""
import asyncio
import logging
from sqlalchemy.exc import IntegrityError
from .db import SessionLocal
from .ingestion import import_candidate
from .providers import OpenLibrary, GoogleBooks

log=logging.getLogger(__name__)
REGISTRY={"openlibrary":OpenLibrary,"googlebooks":GoogleBooks}

async def import_books(provider_name:str,search_term:str,limit:int=20):
    if provider_name not in REGISTRY:raise ValueError("Unsupported provider")
    provider=REGISTRY[provider_name]()
    imported=[]
    for candidate in await provider.search(search_term,min(40,max(1,limit))):
        try:
            async with SessionLocal() as db:
                async with db.begin():
                    book=await import_candidate(db,provider,candidate.external_id)
                    if book:imported.append(str(book.id))
        except (ValueError,IntegrityError) as exc:
            log.warning("Catalogue import needs review: %s",exc)
    return imported
