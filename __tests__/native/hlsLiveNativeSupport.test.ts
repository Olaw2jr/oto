/// <reference types="node" />
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('native HLS/live support', () => {
  it('maps HLS into RNTP v4 on iOS', () => {
    const driver = read('app/adapters/audio/NativeRntpDriver.ts');
    expect(driver).toContain('TrackType.HLS');
    expect(driver).toContain('isLiveStream');
  });

  it('maps HLS into Media3 on Android', () => {
    const module = read(
      'android/app/src/main/java/tz/co/oto/media/OtoMedia3Module.kt',
    );
    const gradle = read('android/app/build.gradle');

    expect(module).toContain('MimeTypes.APPLICATION_M3U8');
    expect(module).toContain('streamType');
    expect(gradle).toContain('media3-exoplayer-hls');
  });

  it('documents that live playback is not a rights bypass', () => {
    const docs = read('docs/architecture/hls-live-playback.md');
    expect(docs).toContain('RightsPolicy');
    expect(docs).toContain('HLS');
    expect(docs).toContain('live');
  });
});
