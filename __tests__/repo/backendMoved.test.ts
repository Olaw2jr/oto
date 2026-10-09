import {execFileSync} from 'node:child_process';
import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';

// The backend lives in github.com/Olaw2jr/oto-api. This repo is the app.
const root = path.resolve(__dirname, '../..');
const tracked = execFileSync('git', ['ls-files'], {cwd: root, encoding: 'utf8'})
  .split('\n')
  .filter(Boolean);

describe('backend lives in oto-api', () => {
  it('keeps no server or backend code in the app repo', () => {
    expect(
      tracked.filter(file => /^(server|backend|__tests__\/server)\//.test(file)),
    ).toEqual([]);
  });

  it('has nothing importing the old server code', () => {
    const importers = tracked
      .filter(file => /\.(ts|tsx|js)$/.test(file) && existsSync(path.join(root, file)))
      .filter(file =>
        /from ['"][./]+\/server\//.test(readFileSync(path.join(root, file), 'utf8')),
      );
    expect(importers).toEqual([]);
  });

  it('points contributors at oto-api', () => {
    for (const doc of ['README.md', 'CONTRIBUTING.md']) {
      expect(readFileSync(path.join(root, doc), 'utf8')).toContain(
        'https://github.com/Olaw2jr/oto-api',
      );
    }
  });
});
