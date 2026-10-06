/// <reference types="node" />
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('RNTP sleep timer service integration', () => {
  it('evaluates persisted timers from background playback events', () => {
    const service = read('app/audio/rntp/PlaybackService.ts');
    expect(service).toContain('Event.PlaybackProgressUpdated');
    expect(service).toContain('Event.PlaybackActiveTrackChanged');
    expect(service).toContain('PlaybackServiceSleepTimer');
  });

  it('keeps the sleep timer outside React component state', () => {
    const native = read('app/audio/sleep/createNativeSleepTimerController.ts');
    expect(native).toContain('AsyncStorageSleepTimerStore');
    expect(native).toContain('getActiveTrackIndex');
    expect(native).toContain('oto.audio.sleepTimer');
  });
});
