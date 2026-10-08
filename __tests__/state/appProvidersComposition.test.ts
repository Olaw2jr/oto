/// <reference types="node" />
import fs from 'fs';
import path from 'path';

const source = fs.readFileSync(
  path.resolve(__dirname, '../../app/state/AppProviders.tsx'),
  'utf8',
);

describe('AppProviders composition', () => {
  it('creates the dependency graph at the application boundary', () => {
    expect(source).toContain('createPersistentApplicationContainer');
    expect(source).toContain('container.library');
    expect(source).toContain('LibraryProvider');
    expect(source).toContain('container.audio.createPlayerController');
    expect(source).toContain('PlayerProvider');
  });
});
