# Application composition root

`app/composition/ApplicationContainer.ts` chooses the runtime implementations.
`AppProviders` awaits `createPersistentApplicationContainer` before mounting
consumers. A database failure shows a retry action; it never falls back to a
fresh in-memory library or deletes user data.

The production graph runs the existing versioned migrations, hydrates the
observable library snapshot from SQLite, and routes LibraryService writes to
the SQLite repositories. Successful service writes invalidate the same snapshot
used by React. Chapter playback uses that same service and database, so playback
and library screens do not maintain competing stores. The provider adapter
serializes UI writes; `flush()` reports write failures without poisoning later
operations. Ratings, custom shelves and bookmarks remain outside this wiring.

`createApplicationContainer` remains an explicitly injectable seed graph for
unit tests and prototypes. Importing composition does not load the native JSI
driver; only production startup opens `oto.sqlite`. Migrations preserve existing
rows (including legacy rendition IDs and unrelated tables). Seed catalogue data
is not inserted over a user's library on startup.

The real SQLite integration tests exercise the OP-SQLite adapter boundary using
Node's SQLite engine, including file close/reopen, migration rollback/retry and
legacy data preservation. Native driver linking is verified by platform builds.
