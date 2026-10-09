from dataclasses import dataclass, field
from typing import Any, Protocol

@dataclass(frozen=True)
class Candidate:
    provider: str
    external_id: str
    title: str
    authors: list[str] = field(default_factory=list)
    identifiers: dict[str, list[str]] = field(default_factory=dict)

@dataclass(frozen=True)
class BookRecord(Candidate):
    subtitle: str | None = None
    description: str | None = None
    subjects: list[str] = field(default_factory=list)
    publisher: str | None = None
    published_at: str | None = None
    language: str | None = None
    cover_url: str | None = None
    provenance: dict[str, Any] = field(default_factory=dict)

@dataclass(frozen=True)
class Rendition:
    provider: str
    external_id: str
    title: str
    authors: list[str]
    language: str
    narrators: list[str]
    duration_sec: int | None
    chapters: list[dict]
    asset_refs: list[tuple[str, str]]
    rights_status: str = "unknown"

@dataclass(frozen=True)
class Asset:
    provider: str
    external_id: str
    format: str
    kind: str
    location: str
    file_path: str | None = None
    size_bytes: int | None = None
    checksum: str | None = None
    rights_status: str = "unknown"

class MetadataProvider(Protocol):
    id: str
    async def search(self, query: str, limit: int = 20) -> list[Candidate]: ...
    async def get(self, external_id: str) -> BookRecord | None: ...

class AudioCatalogueProvider(Protocol):
    id: str
    async def find_renditions(self, title: str, authors: list[str]) -> list[Rendition]: ...

class AssetProvider(Protocol):
    id: str
    async def resolve_assets(self, rendition: Rendition) -> list[Asset]: ...
