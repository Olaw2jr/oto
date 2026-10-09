import React from 'react';
import {renderHook} from '@testing-library/react-native';

import {
  ObservableLibraryRepository,
  ObservableProgressRepository,
  ServiceLibraryProviderAdapter,
  createSeedLibraryGraph,
  seedRenditionId,
} from '../../app/adapters/library';
import {getBook, PUBLIC_DOMAIN_SAMPLE_ID} from '../../app/data/catalogue';
import {LibraryService} from '../../app/services/LibraryService';
import {LibraryProvider} from '../../app/state/library';
import {PlayerProvider, usePlayer} from '../../app/state/player';
import {SettingsProvider} from '../../app/state/settings';

// What a fresh install sees: the SQLite library starts empty.
const emptyLibrary = () => {
  const seed = createSeedLibraryGraph();
  const library = new ObservableLibraryRepository([]);
  const progress = new ObservableProgressRepository();
  const service = new LibraryService({
    catalogue: seed.catalogue,
    renditions: seed.renditions,
    library,
    progress,
  });
  return new ServiceLibraryProviderAdapter(
    service,
    library,
    progress,
    seedRenditionId,
    id => getBook(id).durationSec,
  );
};

const bookShown = (adapter?: ServiceLibraryProviderAdapter) => {
  const wrapper = ({children}: {children: React.ReactNode}) => (
    <SettingsProvider>
      <LibraryProvider adapter={adapter}>
        <PlayerProvider>{children}</PlayerProvider>
      </LibraryProvider>
    </SettingsProvider>
  );
  return renderHook(() => usePlayer(), {wrapper}).result.current.book.id;
};

describe('first run', () => {
  it('offers the playable public-domain sample on a fresh install', () => {
    expect(bookShown(emptyLibrary())).toBe(PUBLIC_DOMAIN_SAMPLE_ID);
  });

  it('continues a book you are listening to when there is one', () => {
    expect(bookShown()).toBe('where-the-crawdads-sing');
  });

  it('does not slow first loads down on purpose', () => {
    expect(jest.requireActual('../../app/data/latency').MOCK_LATENCY_MS).toBe(0);
  });
});
