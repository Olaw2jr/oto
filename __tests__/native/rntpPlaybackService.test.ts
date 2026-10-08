/// <reference types="node" />
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('background playback service wiring', () => {
  it('registers the playback service from the process entrypoint', () => {
    const entry = read('index.js');
    expect(entry).toContain("if (Platform.OS === 'ios')");
    expect(entry).not.toMatch(/^import TrackPlayer from ['"]react-native-track-player['"]/m);
    expect(entry).toContain('registerPlaybackService');
    expect(entry).toContain('PlaybackService');
  });

  it('handles remote transport controls in the playback service', () => {
    const service = read('app/adapters/audio/PlaybackService.ts');

    for (const event of [
      'Event.RemotePlay',
      'Event.RemotePause',
      'Event.RemoteSeek',
      'Event.RemoteJumpForward',
      'Event.RemoteJumpBackward',
      'Event.RemoteNext',
      'Event.RemotePrevious',
    ]) {
      expect(service).toContain(event);
    }
  });

  it('declares iOS background audio capability', () => {
    const plist = read('ios/Eyy/Info.plist');
    expect(plist).toContain('<key>UIBackgroundModes</key>');
    expect(plist).toContain('<string>audio</string>');
  });
});
