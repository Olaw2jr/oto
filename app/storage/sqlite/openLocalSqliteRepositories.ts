import {MigrationRunner} from './MigrationRunner';
import {migrations} from './migrations';
import {openOpSqliteDatabase} from './OpSqliteDatabase';
import {SqliteLibraryRepository} from './SqliteLibraryRepository';
import {SqliteProgressRepository} from './SqliteProgressRepository';

export const openLocalSqliteRepositories = async (name = 'oto.sqlite') => {
  const db = openOpSqliteDatabase(name);
  await new MigrationRunner(db, migrations).migrate();

  return {
    db,
    library: new SqliteLibraryRepository(db),
    progress: new SqliteProgressRepository(db),
  };
};
