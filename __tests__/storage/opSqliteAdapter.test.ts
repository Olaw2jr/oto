import {OpSqliteDatabase} from '../../app/storage/sqlite';

type NativeResult = {
  rowsAffected: number;
  rows: Array<Record<string, string | number | boolean | null>>;
};

class FakeNativeDatabase {
  calls: Array<{sql: string; params?: unknown[]}> = [];
  rows: NativeResult['rows'] = [];
  transactionCount = 0;

  async execute(sql: string, params?: unknown[]): Promise<NativeResult> {
    this.calls.push({sql, params});
    return {rowsAffected: 0, rows: this.rows};
  }

  async transaction(work: () => Promise<void>): Promise<void> {
    this.transactionCount += 1;
    await work();
  }
}

describe('OP-SQLite adapter', () => {
  it('maps execute and query to the application SqlDatabase boundary', async () => {
    const native = new FakeNativeDatabase();
    native.rows = [{book_id: 'book-1', position_sec: 42}];
    const db = new OpSqliteDatabase(native);

    await db.execute('UPDATE listening_progress SET position_sec = ? WHERE book_id = ?', [
      42,
      'book-1',
    ]);
    const rows = await db.query<{book_id: string; position_sec: number}>(
      'SELECT book_id, position_sec FROM listening_progress',
    );

    expect(native.calls[0]).toEqual({
      sql: 'UPDATE listening_progress SET position_sec = ? WHERE book_id = ?',
      params: [42, 'book-1'],
    });
    expect(rows).toEqual([{book_id: 'book-1', position_sec: 42}]);
  });

  it('delegates transaction boundaries to the native database', async () => {
    const native = new FakeNativeDatabase();
    const db = new OpSqliteDatabase(native);
    let ran = false;

    const result = await db.transaction(async () => {
      ran = true;
      return 'ok';
    });

    expect(result).toBe('ok');
    expect(ran).toBe(true);
    expect(native.transactionCount).toBe(1);
  });
});
