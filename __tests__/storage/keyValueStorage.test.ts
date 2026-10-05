import {MemoryKeyValueStorage} from '../../app/storage/memory/MemoryKeyValueStorage';

describe('KeyValueStorage', () => {
  it('stores, reads and removes string values', async () => {
    const storage = new MemoryKeyValueStorage();

    expect(await storage.getString('library')).toBeNull();

    await storage.setString('library', '{"book":"one"}');
    expect(await storage.getString('library')).toBe('{"book":"one"}');

    await storage.remove('library');
    expect(await storage.getString('library')).toBeNull();
  });

  it('isolates namespaces', async () => {
    const storage = new MemoryKeyValueStorage();

    await storage.namespace('session').setString('state', 'signed-in');
    await storage.namespace('library').setString('state', 'listening');

    expect(await storage.namespace('session').getString('state')).toBe(
      'signed-in',
    );
    expect(await storage.namespace('library').getString('state')).toBe(
      'listening',
    );
  });

  it('clears only the selected namespace', async () => {
    const storage = new MemoryKeyValueStorage();
    const session = storage.namespace('session');
    const library = storage.namespace('library');

    await session.setString('state', 'signed-in');
    await library.setString('state', 'listening');

    await session.clear();

    expect(await session.getString('state')).toBeNull();
    expect(await library.getString('state')).toBe('listening');
  });
});
