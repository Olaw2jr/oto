import {
  FakeSqlDatabase,
  MigrationRunner,
  migrations,
} from '../../app/storage/sqlite';

describe('SQLite migrations', () => {
  it('defines the durable schema needed by oto', () => {
    const sql = migrations.map(migration => migration.sql.join('\n')).join('\n');

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS library_entries');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS listening_progress');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS shelves');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS pending_mutations');
    expect(sql).toContain('ADD COLUMN rendition_id');
    expect(sql).toContain('ADD COLUMN chapter_id');
  });

  it('applies pending migrations in order inside transactions', async () => {
    const db = new FakeSqlDatabase();
    const runner = new MigrationRunner(db, migrations);

    await runner.migrate();

    expect(db.appliedVersions()).toEqual(migrations.map(m => m.version));
    expect(db.transactionCount).toBe(migrations.length);
    expect(db.transactionExecuted).toHaveLength(
      migrations.reduce((count, migration) => count + migration.sql.length + 1, 0),
    );
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

    const runner = new MigrationRunner(db, migrations);
    await runner.migrate();

    expect(db.appliedVersions()).toEqual([1, 2]);
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
