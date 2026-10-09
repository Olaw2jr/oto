/// <reference types="node" />
import {execFileSync} from 'child_process';
import path from 'path';

const root = path.resolve(__dirname, '../..');

describe('repository hygiene', () => {
  // A node_modules symlink once slipped past the directory-only pattern.
  it('never tracks node_modules, as a folder or a symlink', () => {
    const tracked = execFileSync('git', ['ls-files', 'node_modules'], {
      cwd: root,
      encoding: 'utf8',
    });
    expect(tracked).toBe('');
  });
});
