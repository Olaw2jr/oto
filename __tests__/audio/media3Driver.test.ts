import {
  Media3Driver,
  type Media3Bridge,
} from '../../app/audio/media3/Media3Driver';

class FakeBridge implements Media3Bridge {
  calls: Array<{name: string; args: unknown[]}> = [];
  snapshot = {
    state: 'ready',
    trackId: 'track-1',
    positionSec: 12,
    durationSec: 120,
    rate: 1,
    activeIndex: 0,
  };

  async setup(): Promise<void> {
    this.calls.push({name: 'setup', args: []});
  }
  async reset(): Promise<void> {
    this.calls.push({name: 'reset', args: []});
  }
  async setQueue(tracks: unknown[]): Promise<void> {
    this.calls.push({name: 'setQueue', args: [tracks]});
  }
  async skip(index: number, positionSec: number): Promise<void> {
    this.calls.push({name: 'skip', args: [index, positionSec]});
    this.snapshot.activeIndex = index;
    this.snapshot.positionSec = positionSec;
  }
  async play(): Promise<void> {
    this.calls.push({name: 'play', args: []});
    this.snapshot.state = 'playing';
  }
  async pause(): Promise<void> {
    this.calls.push({name: 'pause', args: []});
    this.snapshot.state = 'paused';
  }
  async seekTo(positionSec: number): Promise<void> {
    this.calls.push({name: 'seekTo', args: [positionSec]});
    this.snapshot.positionSec = positionSec;
  }
  async seekBy(deltaSec: number): Promise<void> {
    this.calls.push({name: 'seekBy', args: [deltaSec]});
    this.snapshot.positionSec += deltaSec;
  }
  async setRate(rate: number): Promise<void> {
    this.calls.push({name: 'setRate', args: [rate]});
    this.snapshot.rate = rate;
  }
  async getSnapshot() {
    return {...this.snapshot};
  }
  async updateOptions(options: unknown): Promise<void> {
    this.calls.push({name: 'updateOptions', args: [options]});
  }
  async warmCache(
    uri: string,
    cacheKey: string,
    bufferSec: number,
  ): Promise<void> {
    this.calls.push({
      name: 'warmCache',
      args: [uri, cacheKey, bufferSec],
    });
  }
  async evictCache(cacheKey: string): Promise<void> {
    this.calls.push({name: 'evictCache', args: [cacheKey]});
  }
}

describe('Media3Driver', () => {
  it('maps the oto driver contract to the Media3 native bridge', async () => {
    const bridge = new FakeBridge();
    const driver = new Media3Driver(bridge);

    await driver.setupPlayer();
    await driver.setQueue([
      {
        id: 'track-1',
        url: 'https://example.test/1.m4a',
        title: 'Chapter 1',
        duration: 120,
        bookId: 'book-1',
        renditionId: 'rendition-1',
        chapterId: 'chapter-1',
      },
    ]);
    await driver.skip(0, 12);
    await driver.play();
    await driver.seekBy(3);
    await driver.setRate(1.25);

    expect(await driver.getProgress()).toMatchObject({
      position: 15,
      duration: 120,
    });
    expect(await driver.getPlaybackState()).toBe('playing');
    expect(await driver.getRate()).toBe(1.25);
    expect(await driver.getActiveTrackIndex()).toBe(0);
  });

  it('forwards Media3 events through the existing driver subscription shape', () => {
    const bridge = new FakeBridge();
    let nativeListener: (() => void) | undefined;
    const driver = new Media3Driver(
      bridge,
      listener => {
        nativeListener = listener;
        return () => {
          nativeListener = undefined;
        };
      },
    );
    const listener = jest.fn();

    const subscription = driver.addEventListener(
      'playback-progress-updated',
      listener,
    );
    nativeListener?.();

    expect(listener).toHaveBeenCalledTimes(1);
    subscription.remove();
  });
});
