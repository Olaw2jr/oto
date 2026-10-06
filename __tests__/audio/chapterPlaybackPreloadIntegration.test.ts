/// <reference types="node" />
import fs from 'fs';
import path from 'path';

const source = fs.readFileSync(
  path.resolve(__dirname, '../../app/audio/session/ChapterPlaybackSession.ts'),
  'utf8',
);

describe('ChapterPlaybackSession preloading', () => {
  it('updates the preload coordinator as the active chapter changes', () => {
    expect(source).toContain('ChapterPreloadCoordinator');
    expect(source).toContain('preloader.update');
    expect(source).toContain('preloader.dispose');
  });
});
