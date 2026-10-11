import React from 'react';
import {act, fireEvent, screen} from '@testing-library/react-native';

import {seedRenditionId} from '../../app/adapters/library';
import {PUBLIC_DOMAIN_SAMPLE_ID} from '../../app/data/catalogue';
import {FakeDownloadEngine} from '../../app/downloads';
import BookScreen from '../../app/features/book/BookScreen';
import DownloadsScreen from '../../app/features/downloads/DownloadsScreen';
import type {PlaybackAssetRepository} from '../../app/player';
import {mockNavigation, renderScreen} from '../test-utils';

const press = (el: any) =>
  act(async () => {
    fireEvent.press(el);
  });
const route = (name: string, params?: object) => ({key: name, name, params} as any);

// Gives the public-domain sample's 24 chapters an HTTPS source each.
const sampleAssets: PlaybackAssetRepository = {
  listForRendition: async renditionId =>
    renditionId !== seedRenditionId(PUBLIC_DOMAIN_SAMPLE_ID)
      ? []
      : Array.from({length: 24}, (_, i) => ({
          chapterId: `${PUBLIC_DOMAIN_SAMPLE_ID}:chapter-${i + 1}`,
          asset: {
            id: `sample-${i + 1}`,
            renditionId,
            format: 'mp3' as const,
            sizeBytes: 1_000_000,
            sources: [
              {kind: 'https' as const, uri: `https://archive.org/c${i + 1}.mp3`, trustedSourceId: 'internetarchive'},
            ],
          },
        })),
};

const renderBook = async (bookId = PUBLIC_DOMAIN_SAMPLE_ID) => {
  const engine = new FakeDownloadEngine();
  await renderScreen(
    <BookScreen navigation={mockNavigation()} route={route('Book', {bookId})} />,
    {downloadEngine: engine, playbackAssets: sampleAssets},
  );
  return engine;
};

describe('downloading a book', () => {
  it('downloads every chapter and shows progress', async () => {
    const engine = await renderBook();

    await press(screen.getByRole('button', {name: 'Download'}));
    expect(engine.requests).toHaveLength(24);
    // Wi-Fi only is on by default.
    expect(engine.requests[0].wifiOnly).toBe(true);

    await act(async () => {
      engine.progress('sample-1', 1_000_000, 1_000_000, 'completed');
      engine.progress('sample-2', 500_000, 1_000_000, 'downloading');
    });
    expect(screen.getByRole('button', {name: 'Cancel download, 6% downloaded'})).toBeOnTheScreen();
  });

  it('says when it is waiting for Wi-Fi', async () => {
    const engine = await renderBook();
    await press(screen.getByRole('button', {name: 'Download'}));
    await act(async () => {
      engine.progress('sample-1', 0, 1_000_000, 'paused');
    });
    expect(screen.getByText('Waiting for Wi-Fi')).toBeOnTheScreen();
  });

  it('removes a finished download', async () => {
    const engine = await renderBook();
    await press(screen.getByRole('button', {name: 'Download'}));
    await act(async () => {
      for (let i = 1; i <= 24; i++) engine.progress(`sample-${i}`, 1_000_000, 1_000_000, 'completed');
    });
    expect(screen.getByText('Downloaded · 24 MB')).toBeOnTheScreen();
    await press(screen.getByRole('button', {name: 'Remove download'}));
    expect(await engine.list()).toEqual([]);
    expect(screen.getByRole('button', {name: 'Download'})).toBeOnTheScreen();
  });

  it('offers no download for books without cleared audio', async () => {
    await renderBook('where-the-crawdads-sing');
    expect(screen.queryByRole('button', {name: 'Download'})).toBeNull();
  });
});

describe('DownloadsScreen', () => {
  it('lists downloaded books and removes them', async () => {
    const engine = new FakeDownloadEngine();
    await engine.start({id: 'sample-1', bookId: PUBLIC_DOMAIN_SAMPLE_ID, uri: 'https://x', cacheKey: 'k', title: 'Chapter 1', sizeBytes: 2_000_000, wifiOnly: true});
    engine.progress('sample-1', 2_000_000, 2_000_000, 'completed');
    await renderScreen(
      <DownloadsScreen navigation={mockNavigation()} route={route('Downloads')} />,
      {downloadEngine: engine, playbackAssets: sampleAssets},
    );

    expect(screen.getByText('The Adventures of Sherlock Holmes')).toBeOnTheScreen();
    expect(screen.getByText('Downloaded · 2 MB')).toBeOnTheScreen();
    await press(screen.getByRole('button', {name: 'Remove The Adventures of Sherlock Holmes'}));
    expect(screen.getByText('Nothing downloaded yet.')).toBeOnTheScreen();
  });
});
