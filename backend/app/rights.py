"""Server-side permission checks. Blank territories are not evidence of global rights."""
from dataclasses import dataclass
from .models import AudioSource

@dataclass(frozen=True)
class SourceDecision:
    allowed: bool
    reason: str

def evaluate_source(source: AudioSource, territory: str,
                    trusted_providers: frozenset[str]) -> SourceDecision:
    if source.rights_status not in ("public-domain", "licensed"):
        return SourceDecision(False, "unverified-rights")
    if source.trusted_source_id not in trusted_providers:
        return SourceDecision(False, "untrusted-provider")
    allowed_territories = source.rights_territories or []
    if not territory or (
        "WORLD" not in allowed_territories and territory not in allowed_territories
    ):
        return SourceDecision(False, "territory-not-verified")
    if source.kind not in ("https", "torrent", "hls"):
        return SourceDecision(False, "unsupported-transport")
    if not source.location.startswith("https://") and source.kind != "torrent":
        return SourceDecision(False, "insecure-location")
    return SourceDecision(True, "allowed")
