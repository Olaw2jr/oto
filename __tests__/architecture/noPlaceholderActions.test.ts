/// <reference types="node" />
import {readdirSync, readFileSync, statSync} from 'node:fs';
import {join, relative} from 'node:path';

// FI-01: production screens must not ship controls that do nothing.
const root = join(__dirname, '../../app');

const sources = (dir: string): string[] =>
  readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      return name === 'testing' ? [] : sources(path);
    }
    return /\.tsx?$/.test(name) ? [path] : [];
  });

describe('production UI', () => {
  it('has no empty press handlers', () => {
    const offenders = sources(root)
      .filter(path =>
        /on(Press|LongPress)=\{\(\)\s*=>\s*\{\s*\}\}/.test(
          readFileSync(path, 'utf8'),
        ),
      )
      .map(path => relative(root, path));
    expect(offenders).toEqual([]);
  });
});
