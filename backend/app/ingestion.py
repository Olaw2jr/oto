"""Transactional canonical catalogue ingestion.

Exact trusted work IDs and ISBNs identify candidates; uncertain matches remain
unmerged. Provider provenance is retained for subsequent corrections.
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from .models import Book, BookIdentifier, Contributor, BookContributor, ProviderRecord
from .normalisation import norm
from .providers.contracts import BookRecord

def flattened_identifiers(record: BookRecord):
    for scheme, values in record.identifiers.items():
        for value in values:
            token = value.strip().upper().replace("-", "").replace(" ", "") if scheme.lower().startswith("isbn") else value.strip()
            if token:
                yield scheme.lower(), token

async def ingest_record(db: AsyncSession, record: BookRecord) -> Book:
    if not record.title.strip():
        raise ValueError("A title is required")
    existing = await db.scalar(select(ProviderRecord).where(
        ProviderRecord.provider == record.provider,
        ProviderRecord.external_id == record.external_id))
    if existing:
        book = await db.get(Book, existing.book_id)
        # Never overwrite manually edited canonical fields on a refresh.
        existing.payload = record.provenance | {
            "title": record.title, "authors": record.authors,
            "description": record.description, "identifiers": record.identifiers}
        await db.flush()
        return book

    identifiers = list(flattened_identifiers(record))
    matches = []
    for scheme, value in identifiers:
        found = (await db.scalars(select(BookIdentifier.book_id).where(
            BookIdentifier.scheme == scheme, BookIdentifier.value == value))).all()
        matches.extend(found)
    # Multiple distinct matches indicate conflicting records. Never auto-merge.
    if len(set(matches)) > 1:
        raise ValueError("Conflicting identifiers; manual review required")
    book = await db.get(Book, matches[0]) if matches else None
    if book is None:
        book = Book(title=record.title, subtitle=record.subtitle,
                    description=record.description, language=record.language,
                    cover_url=record.cover_url)
        db.add(book)
        await db.flush()
    for scheme, value in identifiers:
        present = await db.scalar(select(BookIdentifier).where(
            BookIdentifier.scheme == scheme, BookIdentifier.value == value))
        if present is None:
            db.add(BookIdentifier(book_id=book.id, scheme=scheme, value=value))
    for author in record.authors:
        if not author.strip():continue
        # Do not globally merge people by name: two authors can share a name.
        prior = await db.scalar(select(Contributor).join(BookContributor).where(
            BookContributor.book_id == book.id, Contributor.name == author))
        if prior is None:
            person = Contributor(name=author)
            db.add(person)
            await db.flush()
            db.add(BookContributor(book_id=book.id, contributor_id=person.id, role="author"))
    db.add(ProviderRecord(book_id=book.id, provider=record.provider,
                          external_id=record.external_id, payload={
                              "title": record.title, "subtitle": record.subtitle,
                              "description": record.description, "authors": record.authors,
                              "subjects": record.subjects, "identifiers": record.identifiers,
                              "provenance": record.provenance,
                              "publisher": record.publisher,
                              "published_at": record.published_at}))
    await db.flush()
    return book

async def import_candidate(db: AsyncSession, provider, external_id: str) -> Book | None:
    record = await provider.get(external_id)
    if record is None:
        return None
    return await ingest_record(db, record)
