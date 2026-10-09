/// <reference types="node" />
import {DatabaseSync} from 'node:sqlite';

import {OpSqliteDatabase} from '../../app/storage/sqlite';
import type {OpSqliteClient} from '../../app/storage/sqlite/OpSqliteDatabase';

// Exercise the driver boundary with real SQLite, including file reopen and DDL
// rollback, instead of reproducing SQLite behavior in a fake SQL parser.
export const openNodeSqlite = (filename: string) => {
  const native = new DatabaseSync(filename);
  const execute: OpSqliteClient['execute'] = async (sql, params = []) => {
    const statement = native.prepare(sql);
    return {
      rows: statement.all(...(params as (string | number | null)[])) as Record<
        string,
        string | number | null
      >[],
    };
  };
  const db = new OpSqliteDatabase({
    execute,
    transaction: async work => {
      native.exec('BEGIN');
      try {
        await work({execute});
        native.exec('COMMIT');
      } catch (error) {
        native.exec('ROLLBACK');
        throw error;
      }
    },
  });
  return {db, close: () => native.close()};
};
