import {
  FakeSqlDatabase,
  MigrationRunner,
  migrations,
} from '../../app/storage/sqlite';

describe('SQLite migrations', () => {
  it('defines the initial durable schema needed by oto', () => {
    const sql = migrations.map(migration => migration.sql.join('\n')).join('\n');

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS library_entries');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS listening_progress');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS shelves');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS shelf_books');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS ratings');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS social_activity');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS pending_mutations');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS metadata_cache');
  });

  it('applies pending migrations in order inside transactions', async () => {
    const db = new FakeSqlDatabase();
    const runner = new MigrationRunner(db, migrations);

    await runner.migrate();

    expect(db.appliedVersions()).toEqual(migrations.map(m => m.version));
    expect(db.transactionCount).toBe(migrations.length);
  });

  it('does not reapply already recorded migrations', async () => {
    const db = new FakeSqlDatabase();
    const runner = new MigrationRunner(db, migrations);

    await runner.migrate();
    const firstExecutionCount = db.executed.length;
    await runner.migrate();

    expect(db.executed).toHaveLength(firstExecutionCount + 1);
    expect(db.appliedVersions()).toEqual(migrations.map(m => m.version));
  });

  it('continues from a partially migrated database', async () => {
    const db = new FakeSqlDatabase();
    await db.execute(
      'CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL)',
    );
    await db.execute(
      'INSERT INTO schema_migrations(version, name, applied_at) VALUES (?, ?, ?)',
      [1, 'initial_core', '2026-10-05T00:00:00.000Z'],
    );

    const runner = new MigrationRunner(db, [
      migrations[0],
      {
        version: 2,
        name: 'downloads',
        sql: [
          'CREATE TABLE IF NOT EXISTS downloads (id TEXT PRIMARY KEY, state TEXT NOT NULL)',
        ],
      },
    ]);

    await runner.migrate();

    expect(db.appliedVersions()).toEqual([1, 2]);
    expect(db.executed.some(statement => statement.sql.includes('CREATE TABLE IF NOT EXISTS downloads')))
      .toBe(true);
  });

  it('rejects duplicate or unordered migration versions', () => {
    const db = new FakeSqlDatabase();

    expect(
      () =>
        new MigrationRunner(db, [
          {version: 2, name: 'two', sql: ['SELECT 2']},
          {version: 1, name: 'one', sql: ['SELECT 1']},
        ]),
    ).toThrow('Migrations must be strictly ordered by version');
  });
});
