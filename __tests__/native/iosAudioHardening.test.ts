/// <reference types="node" />
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('iOS AVPlayer / Now Playing hardening', () => {
  it('uses the playback category and spoken-audio mode', () => {
    const driver = read('app/adapters/audio/NativeRntpDriver.ts');
    expect(driver).toContain('IOSCategory.Playback');
    expect(driver).toContain('IOSCategoryMode.SpokenAudio');
    expect(driver).toContain('autoHandleInterruptions: true');
  });

  it('uses the voice pitch algorithm for audiobook chapters', () => {
    const driver = read('app/adapters/audio/NativeRntpDriver.ts');
    expect(driver).toContain('PitchAlgorithm.Voice');
  });

  it('keeps iOS background audio declared', () => {
    const plist = read('ios/Eyy/Info.plist');
    expect(plist).toContain('<key>UIBackgroundModes</key>');
    expect(plist).toContain('<string>audio</string>');
  });
});
