export type SqlMigration = {
  version: number;
  name: string;
  sql: string[];
};

export const migrations: SqlMigration[] = [
  {
    version: 1,
    name: 'initial_core',
    sql: [
      `CREATE TABLE IF NOT EXISTS library_entries (
        book_id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        position_sec REAL NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS listening_progress (
        book_id TEXT PRIMARY KEY,
        position_sec REAL NOT NULL DEFAULT 0,
        duration_sec REAL NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS shelves (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS shelf_books (
        shelf_id TEXT NOT NULL,
        book_id TEXT NOT NULL,
        position INTEGER NOT NULL DEFAULT 0,
        added_at TEXT NOT NULL,
        PRIMARY KEY (shelf_id, book_id)
      )`,
      `CREATE TABLE IF NOT EXISTS ratings (
        book_id TEXT PRIMARY KEY,
        rating REAL NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS social_activity (
        id TEXT PRIMARY KEY,
        book_id TEXT,
        actor_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        body TEXT,
        created_at TEXT NOT NULL,
        payload_json TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS pending_mutations (
        id TEXT PRIMARY KEY,
        kind TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        retry_at TEXT,
        last_error TEXT
      )`,
      `CREATE INDEX IF NOT EXISTS idx_pending_mutations_ready
        ON pending_mutations(retry_at, created_at)`,
      `CREATE TABLE IF NOT EXISTS metadata_cache (
        cache_key TEXT PRIMARY KEY,
        value_json TEXT NOT NULL,
        etag TEXT,
        fetched_at TEXT NOT NULL,
        stale_at TEXT
      )`,
    ],
  },
  {
    version: 2,
    name: 'rendition_aware_progress',
    sql: [
      `ALTER TABLE listening_progress
        ADD COLUMN rendition_id TEXT NOT NULL DEFAULT 'legacy'`,
      `ALTER TABLE listening_progress
        ADD COLUMN chapter_id TEXT`,
      `CREATE INDEX IF NOT EXISTS idx_listening_progress_rendition
        ON listening_progress(book_id, rendition_id)`,
    ],
  },
  {
    version: 3,
    name: 'bookmarks',
    sql: [
      `CREATE TABLE IF NOT EXISTS bookmarks (
        book_id TEXT NOT NULL,
        at_sec INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (book_id, at_sec)
      )`,
    ],
  },
];
