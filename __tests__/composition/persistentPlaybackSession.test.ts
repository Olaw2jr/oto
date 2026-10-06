/// <reference types="node" />
import fs from 'fs';
import path from 'path';

const source = fs.readFileSync(
  path.resolve(__dirname, '../../app/composition/ApplicationContainer.ts'),
  'utf8',
);

describe('persistent playback session composition', () => {
  it('uses SQLite-backed progress for the durable playback session', () => {
    expect(source).toContain('SqliteLibraryRepository');
    expect(source).toContain('SqliteProgressRepository');
    expect(source).toContain('ChapterPlaybackSession');
    expect(source).toContain('createPersistentSession');
  });
});
