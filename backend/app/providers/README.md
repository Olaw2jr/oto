# BE-02 and BE-03 provider implementation

These adapters implement the existing TypeScript catalogue-provider boundaries
in Python. All HTTP clients are injected for deterministic tests.

## Supported

- Open Library work search and details
- Google Books volume search, details and ISBN enrichment
- LibriVox narrated renditions, chapters and Archive references
- Internet Archive audio file manifests and torrent transport alternatives
- Identity-first canonical ingestion with provider-record provenance

`ingest_record` requires a caller-managed database transaction. Provider
imports must be executed by trusted server-side jobs, not unauthenticated
client endpoints.

## Merge policy

Provider ID reingestion is idempotent. Shared identifiers may map records to
the same canonical work, but do not force conflicting existing works to merge.
Title-only similarity never merges books. A human review process is required
for editions, translations, conflicting identifiers and ambiguous duplicates.

ISBNs are edition identifiers rather than dependable universal work IDs.
Production merging should further qualify identifier source and edition
relationships and introduce a merge-audit log and override workflow.

## Limitations

This PR does not yet add recurring provider ingestion jobs, provider quotas,
editors' merge workflow, a verified rights catalogue, or an authenticated
administrative ingestion interface. It does not automatically expose any new
audio source to the mobile player.
