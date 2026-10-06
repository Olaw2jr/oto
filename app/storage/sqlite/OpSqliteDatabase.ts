import type {
  SqlDatabase,
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

type NativeQueryResult = {
  rows?: Array<Record<string, NativeScalar>>;
};

export type OpSqliteClient = {
  execute(
    sql: string,
    params?: NativeScalar[],
  ): Promise<NativeQueryResult>;
  transaction(work: () => Promise<void>): Promise<void>;
};

export class OpSqliteDatabase implements SqlDatabase {
  constructor(private readonly client: OpSqliteClient) {}

  async execute(sql: string, params: SqlParams = []): Promise<void> {
    await this.client.execute(sql, [...params] as NativeScalar[]);
  }

  async query<T extends SqlRow = SqlRow>(
    sql: string,
    params: SqlParams = [],
  ): Promise<T[]> {
    const result = await this.client.execute(
      sql,
      [...params] as NativeScalar[],
    );
    return (result.rows ?? []) as T[];
  }

  async transaction<T>(work: () => Promise<T>): Promise<T> {
    let completed = false;
    let result!: T;

    await this.client.transaction(async () => {
      result = await work();
      completed = true;
    });

    if (!completed) {
      throw new Error('OP-SQLite transaction did not complete');
    }
    return result;
  }
}
