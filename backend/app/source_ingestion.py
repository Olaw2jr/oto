"""Persist narrated editions and multiple provider audio transport alternatives.

The caller owns the transaction. No source is considered playable merely
because a provider supplies a link.
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from .models import AudioSource, Book, Edition, ProviderRecord
from .providers.contracts import Asset, Rendition

async def ingest_rendition(db: AsyncSession, book: Book, rendition: Rendition) -> Edition:
    record = await db.scalar(select(ProviderRecord).where(
        ProviderRecord.provider == rendition.provider,
        ProviderRecord.external_id == rendition.external_id))
    if record is not None:
        if record.book_id != book.id:
            raise ValueError("Rendition linked to another canonical book")
        if record.edition_id is not None:
            edition = await db.get(Edition, record.edition_id)
            if edition:
                return edition
    edition = Edition(book_id=book.id, language=rendition.language,
                      narrators=rendition.narrators,
                      duration_sec=rendition.duration_sec, chapters=rendition.chapters)
    db.add(edition)
    await db.flush()
    if record is None:
        db.add(ProviderRecord(book_id=book.id, edition_id=edition.id,
            provider=rendition.provider, external_id=rendition.external_id,
            payload={"title": rendition.title, "authors": rendition.authors,
                     "asset_refs": rendition.asset_refs,
                     "rights_status": rendition.rights_status}))
    else:
        record.edition_id = edition.id
    await db.flush()
    return edition

async def ingest_assets(db: AsyncSession, edition: Edition,
                        rendition: Rendition, assets: list[Asset]) -> int:
    inserted = 0
    for asset in assets:
        if asset.provider not in ("internetarchive", "librivox"):
            # New providers require an explicit allowlist review.
            continue
        record = await db.scalar(select(ProviderRecord).where(
            ProviderRecord.provider == asset.provider,
            ProviderRecord.external_id == asset.external_id))
        if record is None:
            record = ProviderRecord(book_id=edition.book_id, edition_id=edition.id,
                provider=asset.provider, external_id=asset.external_id,
                payload={"format": asset.format, "file_path": asset.file_path,
                         "checksum": asset.checksum, "size_bytes": asset.size_bytes})
            db.add(record)
            await db.flush()
        if record.edition_id != edition.id:
            raise ValueError("Asset belongs to a different edition")
        old = await db.scalar(select(AudioSource).where(
            AudioSource.provider_record_id == record.id,
            AudioSource.kind == asset.kind, AudioSource.location == asset.location))
        if old:
            continue
        db.add(AudioSource(edition_id=edition.id, provider_record_id=record.id,
            kind=asset.kind, location=asset.location, format=asset.format,
            rights_status=asset.rights_status, trusted_source_id=asset.provider,
            rights_territories=[], metadata_={"file_path": asset.file_path,
            "checksum": asset.checksum, "size_bytes": asset.size_bytes}))
        inserted += 1
    await db.flush()
    return inserted
