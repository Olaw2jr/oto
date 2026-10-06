import type {
  SqlDatabase,
  SqlExecutor,
  SqlParams,
  SqlRow,
} from '../SqlDatabase';

export class FakeSqlDatabase implements SqlDatabase {
  readonly executed: Array<{sql: string; params?: SqlParams}> = [];
  transactionCount = 0;
  private readonly versions = new Set<number>();
  private readonly queryResults: SqlRow[][] = [];

  async execute(sql: string, params?: SqlParams): Promise<void> {
    this.executed.push({sql, params});

    if (
      sql.startsWith('INSERT INTO schema_migrations') &&
      typeof params?.[0] === 'number'
    ) {
      this.versions.add(params[0]);
    }
  }

  async query<T extends SqlRow = SqlRow>(sql: string, _params?: SqlParams): Promise<T[]> {
    if (sql.includes('SELECT version FROM schema_migrations')) {
      return [...this.versions]
        .sort((a, b) => a - b)
        .map(version => ({version} as unknown as T));
    }
    const rows = this.queryResults.shift() ?? [];
    return rows.map(row => ({...row} as T));
  }

  enqueueQueryRows(rows: SqlRow[]): void {
    this.queryResults.push(rows.map(row => ({...row})));
  }

  async transaction<T>(work: (transaction: SqlExecutor) => Promise<T>): Promise<T> {
    this.transactionCount += 1;
    const transaction: SqlExecutor = {
      execute: (sql, params) => this.execute(sql, params),
      query: <Row extends SqlRow = SqlRow>(sql: string, params?: SqlParams) =>
        this.query<Row>(sql, params),
    };
    return work(transaction);
  }

  appliedVersions(): number[] {
    return [...this.versions].sort((a, b) => a - b);
  }
}
