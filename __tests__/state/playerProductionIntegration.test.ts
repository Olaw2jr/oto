/// <reference types="node" />
import fs from 'fs';
import path from 'path';

const source = fs.readFileSync(
  path.resolve(__dirname, '../../app/state/player.tsx'),
  'utf8',
);

describe('production player integration', () => {
  it('contains no mock playback clock or UI sleep timer', () => {
    expect(source).not.toContain('MockPlayerProvider');
    expect(source).not.toContain('setInterval(');
    expect(source).not.toContain('setTimeout(');
    expect(source).not.toContain('A mock player');
  });

  it('loads playback through the injected real controller', () => {
    expect(source).toContain('createController');
    expect(source).toContain('active.loadBook(bookId)');
    expect(source).toContain('active.configureControls');
    expect(source).toContain('active.setSleepTimer');
  });
});
