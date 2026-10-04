/// <reference types="node" />
import fs from 'fs';
import path from 'path';

const appDir = path.resolve(__dirname, '../../app');
const files = (dir: string): string[] =>
  fs.readdirSync(dir, {withFileTypes: true}).flatMap(e => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? files(full) : /\.tsx?$/.test(e.name) ? [full] : [];
  });

describe('styles', () => {
  it('avoid flexbox gap, which React Native 0.70 ignores', () => {
    const offenders = files(appDir).filter(f =>
      /\b(gap|rowGap|columnGap):/.test(fs.readFileSync(f, 'utf8')),
    );
    expect(offenders.map(f => path.relative(appDir, f))).toEqual([]);
  });
});
