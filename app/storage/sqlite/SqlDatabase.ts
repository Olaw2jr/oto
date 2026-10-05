export type SqlValue = string | number | null | Uint8Array;
export type SqlParams = readonly SqlValue[];

export type SqlRow = Record<string, SqlValue>;

export interface SqlDatabase {
  execute(sql: string, params?: SqlParams): Promise<void>;
  query<T extends SqlRow = SqlRow>(
    sql: string,
    params?: SqlParams,
  ): Promise<T[]>;
  transaction<T>(work: () => Promise<T>): Promise<T>;
}
