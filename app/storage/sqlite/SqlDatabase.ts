export type SqlValue = string | number | null | Uint8Array;
export type SqlParams = readonly SqlValue[];

export type SqlRow = Record<string, SqlValue>;

export interface SqlExecutor {
  execute(sql: string, params?: SqlParams): Promise<void>;
  query<T extends SqlRow = SqlRow>(
    sql: string,
    params?: SqlParams,
  ): Promise<T[]>;
}

export interface SqlDatabase extends SqlExecutor {
  transaction<T>(work: (transaction: SqlExecutor) => Promise<T>): Promise<T>;
}
