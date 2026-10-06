import type {
  SqlDatabase,
  SqlExecutor,
  SqlParams,
  SqlRow,
} from './SqlDatabase';

type NativeScalar =
  | string
  | number
  | boolean
  | null
  | ArrayBuffer
  | ArrayBufferView;

type NativeQueryResult = {rows?: Array<Record<string, NativeScalar>>};

export type OpSqliteExecutor = {
  execute(
    sql: string,
    params?: NativeScalar[],
  ): Promise<NativeQueryResult>;
};

export type OpSqliteClient = OpSqliteExecutor & {
  transaction(
    work: (transaction: OpSqliteExecutor) => Promise<void>,
  ): Promise<void>;
};

const createSqlExecutor = (native: OpSqliteExecutor): SqlExecutor => ({
  execute: async (sql, params) => {
    await native.execute(sql, [...(params ?? [])] as NativeScalar[]);
  },
  query: async <Row extends SqlRow = SqlRow>(sql: string, params?: SqlParams) => {
    const result = await native.execute(
      sql,
      [...(params ?? [])] as NativeScalar[],
    );
    return (result.rows ?? []) as Row[];
  },
});

export class OpSqliteDatabase implements SqlDatabase {
  private readonly executor: SqlExecutor;

  constructor(private readonly client: OpSqliteClient) {
    this.executor = createSqlExecutor(client);
  }

  execute(sql: string, params?: SqlParams): Promise<void> {
    return this.executor.execute(sql, params);
  }

  query<Row extends SqlRow = SqlRow>(
    sql: string,
    params?: SqlParams,
  ): Promise<Row[]> {
    return this.executor.query<Row>(sql, params);
  }

  async transaction<T>(work: (transaction: SqlExecutor) => Promise<T>): Promise<T> {
    let completed = false;
    let result!: T;

    await this.client.transaction(async nativeTransaction => {
      result = await work(createSqlExecutor(nativeTransaction));
      completed = true;
    });

    if (!completed) {
      throw new Error('OP-SQLite transaction did not complete');
    }
    return result;
  }
}
