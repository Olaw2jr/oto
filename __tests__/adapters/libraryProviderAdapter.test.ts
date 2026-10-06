import {
  createSeedLibraryProviderAdapter,
  seedRenditionId,
} from '../../app/adapters/library';

describe('LibraryProviderAdapter', () => {
  it('preserves synchronous UI updates while delegating to LibraryService', async () => {
    const adapter = createSeedLibraryProviderAdapter();
    const bookId = 'the-silmarillion';

    expect(adapter.status(bookId)).toBe('want');

    adapter.setPosition(bookId, 120);
    expect(adapter.status(bookId)).toBe('listening');
    expect(adapter.positionSec(bookId)).toBe(120);

    await adapter.flush();
    expect(adapter.positionSec(bookId)).toBe(120);
    expect(adapter.renditionId(bookId)).toBe(seedRenditionId(bookId));
  });

  it('keeps finish and seek clamping behavior in the service-backed adapter', async () => {
    const adapter = createSeedLibraryProviderAdapter();
    const bookId = 'starry-messenger';

    adapter.setPosition(bookId, Number.MAX_SAFE_INTEGER);
    await adapter.flush();

    expect(adapter.progress(bookId)).toBe(1);

    adapter.setStatus(bookId, 'finished');
    await adapter.flush();

    expect(adapter.status(bookId)).toBe('finished');
    expect(adapter.progress(bookId)).toBe(1);
  });

  it('notifies React subscribers for optimistic mutations', () => {
    const adapter = createSeedLibraryProviderAdapter();
    const listener = jest.fn();
    const unsubscribe = adapter.subscribe(listener);

    adapter.setPosition('starry-messenger', 30);

    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });
});
