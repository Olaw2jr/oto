import {open} from '@op-engineering/op-sqlite';

import {MigrationRunner} from './MigrationRunner';
import {migrations} from './migrations';
import {OpSqliteDatabase} from './OpSqliteDatabase';

export const openOtoDatabase = async (): Promise<OpSqliteDatabase> => {
  const native = open({name: 'oto.sqlite'});
  const database = new OpSqliteDatabase(native);

  await database.execute('PRAGMA foreign_keys = ON');
  await new MigrationRunner(database, migrations).migrate();

  return database;
};
