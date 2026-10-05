import type {
  SqlDatabase,
  SqlParams,
  SqlRow,
} from '../SqlDatabase';

export class FakeSqlDatabase implements SqlDatabase {
  readonly executed: Array<{sql: string; params?: SqlParams}> = [];
  transactionCount = 0;
  private readonly versions = new Set<number>();

  async execute(sql: string, params?: SqlParams): Promise<void> {
    this.executed.push({sql, params});

    if (
      sql.startsWith('INSERT INTO schema_migrations') &&
      typeof params?.[0] === 'number'
    ) {
      this.versions.add(params[0]);
    }
  }

  async query<T extends SqlRow = SqlRow>(sql: string): Promise<T[]> {
    if (sql.includes('SELECT version FROM schema_migrations')) {
      return [...this.versions]
        .sort((a, b) => a - b)
        .map(version => ({version} as unknown as T));
    }
    return [];
  }

  async transaction<T>(work: () => Promise<T>): Promise<T> {
    this.transactionCount += 1;
    return work();
  }

  appliedVersions(): number[] {
    return [...this.versions].sort((a, b) => a - b);
  }
}
