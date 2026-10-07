/// <reference types="node" />
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('Android Media3 backend', () => {
  it('pins Media3 1.11.0 playback, session and HLS artifacts', () => {
    const gradle = read('android/app/build.gradle');
    expect(gradle).toContain('media3Version = "1.11.0"');
    expect(gradle).toContain('media3-exoplayer');
    expect(gradle).toContain('media3-session');
    expect(gradle).toContain('media3-exoplayer-hls');
  });

  it('owns Android playback inside a MediaLibraryService', () => {
    const service = read(
      'android/app/src/main/java/tz/co/oto/media/OtoMedia3PlaybackService.kt',
    );
    const manifest = read('android/app/src/main/AndroidManifest.xml');

    expect(service).toContain('MediaLibraryService');
    expect(service).toContain('ExoPlayer.Builder');
    expect(service).toContain('MediaLibrarySession');
    expect(manifest).toContain('OtoMedia3PlaybackService');
    expect(manifest).toContain('FOREGROUND_SERVICE_MEDIA_PLAYBACK');
  });

  it('uses one Media3 cache for playback and warming', () => {
    const cache = read(
      'android/app/src/main/java/tz/co/oto/media/OtoMedia3Cache.kt',
    );
    expect(cache).toContain('SimpleCache');
    expect(cache).toContain('CacheDataSource.Factory');
    expect(cache).toContain('CacheWriter');
  });

  it('uses the same chapter key for preload and playback cache reads', () => {
    const module = read(
      'android/app/src/main/java/tz/co/oto/media/OtoMedia3Module.kt',
    );
    const cache = read(
      'android/app/src/main/java/tz/co/oto/media/OtoMedia3Cache.kt',
    );

    expect(module).toContain('.setCustomCacheKey(mediaId)');
    expect(cache).toContain('.setKey(cacheKey)');
  });

  it('evaluates persisted sleep timers inside the Media3 service', () => {
    const service = read(
      'android/app/src/main/java/tz/co/oto/media/OtoMedia3PlaybackService.kt',
    );
    const timer = read(
      'android/app/src/main/java/tz/co/oto/media/OtoMedia3SleepTimer.kt',
    );
    const module = read(
      'android/app/src/main/java/tz/co/oto/media/OtoMedia3Module.kt',
    );

    expect(timer).toContain('getSharedPreferences');
    expect(timer).toContain('player.pause()');
    expect(service).toContain('sleepTimer.onActiveTrackChanged');
    expect(service).toContain('sleepTimer::onProgress');
    expect(module).toContain('setSleepTimerMinutes');
    expect(module).toContain('setSleepTimerEndOfChapter');
  });
});
