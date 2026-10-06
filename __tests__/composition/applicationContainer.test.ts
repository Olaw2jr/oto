import {createApplicationContainer} from '../../app/composition';
import {LibraryService} from '../../app/services/LibraryService';

describe('application composition root', () => {
  it('assembles catalogue, library service and provider adapter in one graph', () => {
    const container = createApplicationContainer();

    expect(container.services.library).toBeInstanceOf(LibraryService);
    expect(container.repositories.catalogue).toBeDefined();
    expect(container.repositories.renditions).toBeDefined();
    expect(container.repositories.library).toBeDefined();
    expect(container.repositories.progress).toBeDefined();
    expect(container.library).toBeDefined();
    expect(container.storage.openDatabase).toEqual(expect.any(Function));
  });

  it('creates isolated container state per application root', () => {
    const first = createApplicationContainer();
    const second = createApplicationContainer();

    first.library.setPosition('starry-messenger', 123);

    expect(first.library.positionSec('starry-messenger')).toBe(123);
    expect(second.library.positionSec('starry-messenger')).not.toBe(123);
  });
});
