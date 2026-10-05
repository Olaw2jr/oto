import type {SqlDatabase} from './SqlDatabase';
import type {SqlMigration} from './migrations';

type MigrationRow = {
  version: number;
};

const MIGRATION_TABLE_SQL =
  'CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL)';

export class MigrationRunner {
  constructor(
    private readonly db: SqlDatabase,
    private readonly migrationList: SqlMigration[],
  ) {
    for (let index = 1; index < migrationList.length; index += 1) {
      if (migrationList[index].version <= migrationList[index - 1].version) {
        throw new Error('Migrations must be strictly ordered by version');
      }
    }
  }

  async migrate(): Promise<void> {
    await this.db.execute(MIGRATION_TABLE_SQL);

    const rows = await this.db.query<MigrationRow>(
      'SELECT version FROM schema_migrations ORDER BY version',
    );
    const applied = new Set(rows.map(row => row.version));

    for (const migration of this.migrationList) {
      if (applied.has(migration.version)) {
        continue;
      }

      await this.db.transaction(async () => {
        for (const sql of migration.sql) {
          await this.db.execute(sql);
        }
        await this.db.execute(
          'INSERT INTO schema_migrations(version, name, applied_at) VALUES (?, ?, ?)',
          [migration.version, migration.name, new Date().toISOString()],
        );
      });
    }
  }
}
