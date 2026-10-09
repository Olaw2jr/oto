from app.main import app
from app.providers import OpenLibrary, GoogleBooks
from app.provider_jobs import REGISTRY
from app.observability import RequestAudit

def test_discovery_and_sync_routes_registered():
    paths={r.path for r in app.routes}
    assert "/v1/search" in paths
    assert "/v1/discover" in paths
    assert "/v1/me/discover" in paths
    assert "/v1/sync/snapshot" in paths
    assert "/v1/sync/progress/{edition_id}" in paths

def test_provider_import_is_allowlisted():
    assert set(REGISTRY)=={"openlibrary","googlebooks"}

def test_audit_middleware_installed():
    assert any(m.cls is RequestAudit for m in app.user_middleware)
