import {open, type DB, type Scalar} from '@op-engineering/op-sqlite';

import type {
  SqlDatabase,
  SqlExecutor,
  SqlParams,
  SqlRow,
} from './SqlDatabase';

const toScalars = (params?: SqlParams): Scalar[] | undefined =>
  params ? ([...params] as Scalar[]) : undefined;

const createExecutor = (
  execute: (sql: string, params?: Scalar[]) => Promise<{rows: Array<Record<string, Scalar>>}>,
): SqlExecutor => ({
  execute: async (sql: string, params?: SqlParams) => {
    await execute(sql, toScalars(params));
  },
  query: async <Row extends SqlRow = SqlRow>(sql: string, params?: SqlParams) => {
    const result = await execute(sql, toScalars(params));
    return result.rows as Row[];
  },
});

export class OpSqliteDatabase implements SqlDatabase {
  private readonly executor: SqlExecutor;

  constructor(private readonly connection: Pick<DB, 'execute' | 'transaction' | 'close'>) {
    this.executor = createExecutor(connection.execute.bind(connection));
  }

  execute(sql: string, params?: SqlParams): Promise<void> {
    return this.executor.execute(sql, params);
  }

  query<Row extends SqlRow = SqlRow>(sql: string, params?: SqlParams): Promise<Row[]> {
    return this.executor.query<Row>(sql, params);
  }

  async transaction<Result>(
    work: (transaction: SqlExecutor) => Promise<Result>,
  ): Promise<Result> {
    let result!: Result;
    await this.connection.transaction(async nativeTransaction => {
      result = await work(createExecutor(nativeTransaction.execute.bind(nativeTransaction)));
    });
    return result;
  }

  close(): void {
    this.connection.close();
  }
}

export const openOpSqliteDatabase = (name = 'oto.sqlite'): OpSqliteDatabase =>
  new OpSqliteDatabase(open({name}));
