import uuid
from sqlalchemy import inspect
from app.models import (
    Base, AudioSource, Book, Edition, ProviderRecord, OAuthIdentity,
    Follow, OutboxEvent
)

def test_provider_records_deduplicate_by_external_identity():
    constraints = inspect(ProviderRecord).local_table.constraints
    assert any(set(c.columns.keys()) == {"provider", "external_id"} for c in constraints)

def test_one_book_supports_multiple_editions_and_multiple_audio_sources():
    assert "book_id" in inspect(Edition).columns
    assert "edition_id" in inspect(AudioSource).columns
    assert "provider_record_id" in inspect(AudioSource).columns
    assert "rights_status" in inspect(AudioSource).columns

def test_identity_unique_per_oauth_provider():
    constraints = inspect(OAuthIdentity).local_table.constraints
    assert any(set(c.columns.keys()) == {"provider", "subject"} for c in constraints)

def test_follow_and_outbox_are_in_postgres():
    assert {"follower_id", "followed_id"} <= set(inspect(Follow).columns.keys())
    assert {"topic", "payload", "delivered_at"} <= set(inspect(OutboxEvent).columns.keys())

def test_all_entities_registered_in_metadata():
    for name in ["books", "editions", "provider_records", "audio_sources",
                 "users", "oauth_identities", "social_events", "outbox_events"]:
        assert name in Base.metadata.tables
