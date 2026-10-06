jest.mock('@op-engineering/op-sqlite', () => ({open: jest.fn()}));

import {open} from '@op-engineering/op-sqlite';

import {
  OpSqliteDatabase,
  openOpSqliteDatabase,
} from '../../app/storage/sqlite/OpSqliteDatabase';

const openMock = jest.mocked(open);

describe('OP-SQLite adapter', () => {
  it('maps query rows and forwards bound parameters', async () => {
    const execute = jest.fn(async () => ({rows: [{id: 7, title: 'Book'}]}));
    const connection = {execute, transaction: jest.fn(), close: jest.fn()};
    const db = new OpSqliteDatabase(connection as never);

    await expect(db.query('SELECT id, title FROM books WHERE id = ?', [7])).resolves.toEqual([
      {id: 7, title: 'Book'},
    ]);
    expect(execute).toHaveBeenCalledWith('SELECT id, title FROM books WHERE id = ?', [7]);
  });

  it('runs transaction work on the native transaction and returns its result', async () => {
    const execute = jest.fn(async () => ({rows: []}));
    const transactionExecute = jest.fn(async () => ({rows: []}));
    const transaction = jest.fn(async (work: (tx: {execute: typeof transactionExecute}) => Promise<void>) =>
      work({execute: transactionExecute}),
    );
    const db = new OpSqliteDatabase({execute, transaction, close: jest.fn()} as never);

    await expect(
      db.transaction(async tx => {
        await tx.execute('UPDATE books SET title = ? WHERE id = ?', ['New', 7]);
        return 'committed';
      }),
    ).resolves.toBe('committed');
    expect(transactionExecute).toHaveBeenCalledWith('UPDATE books SET title = ? WHERE id = ?', [
      'New',
      7,
    ]);
    expect(execute).not.toHaveBeenCalled();
  });

  it('opens a named database and closes the underlying connection', () => {
    const close = jest.fn();
    openMock.mockReturnValue({execute: jest.fn(), transaction: jest.fn(), close} as never);

    const db = openOpSqliteDatabase('test.sqlite');
    db.close();

    expect(openMock).toHaveBeenCalledWith({name: 'test.sqlite'});
    expect(close).toHaveBeenCalledTimes(1);
  });
});
