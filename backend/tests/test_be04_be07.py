import uuid
from types import SimpleNamespace
from app.rights import evaluate_source
from app.auth_sessions import digest
from app.social_models import Shelf, ShelfBook, Review, Club, ClubMember, Like
from app.models import Base

def source(**overrides):
    data={"rights_status":"unknown","trusted_source_id":"internetarchive",
          "rights_territories":["WORLD"],"kind":"https","location":"https://archive.org/a.mp3"}
    data.update(overrides)
    return SimpleNamespace(**data)

def test_reject_unknown_rights():
    assert evaluate_source(source(), "TZ", frozenset({"internetarchive"})).reason=="unverified-rights"

def test_require_explicit_territory_and_provider_trust():
    approved=source(rights_status="licensed")
    assert evaluate_source(approved,"TZ",frozenset({"internetarchive"})).allowed
    assert not evaluate_source(source(rights_status="licensed",rights_territories=[]),
                               "TZ",frozenset({"internetarchive"})).allowed
    assert not evaluate_source(approved,"TZ",frozenset({"other"})).allowed

def test_session_hash_is_not_bearer_token():
    token="test-secret"
    assert digest(token)!=token
    assert len(digest(token))==64

def test_social_tables_are_registered():
    for name in ("shelves","shelf_books","reviews","clubs","club_members",
                 "event_likes","refresh_sessions"):
        # Explicit import of session model assures metadata registry.
        from app.auth_sessions import RefreshSession
        assert name in Base.metadata.tables
