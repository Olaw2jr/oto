import type {AudioTrack} from '../../app/audio';
import {RntpAudioEngine} from '../../app/audio/rntp/RntpAudioEngine';
import {FakeRntpDriver} from '../../app/audio/rntp/testing/FakeRntpDriver';

describe('iOS audiobook metadata mapping', () => {
  it('preserves narrator, book, artwork and description metadata in the native queue', async () => {
    const driver = new FakeRntpDriver();
    const engine = new RntpAudioEngine(driver);
    const track: AudioTrack = {
      id: 'track-1',
      bookId: 'book-1',
      renditionId: 'rendition-1',
      chapterId: 'chapter-1',
      title: 'Chapter One',
      artist: 'Narrator Name',
      album: 'Book Title',
      artwork: 'https://example.test/cover.jpg',
      description: 'Opening chapter',
      durationSec: 120,
      source: {
        kind: 'remote',
        uri: 'https://example.test/chapter.m4a',
        mimeType: 'audio/mp4',
      },
    };

    await engine.load([track]);

    expect(driver.queue[0]).toMatchObject({
      title: 'Chapter One',
      artist: 'Narrator Name',
      album: 'Book Title',
      artwork: 'https://example.test/cover.jpg',
      description: 'Opening chapter',
    });
  });
});
