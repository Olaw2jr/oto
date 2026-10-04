/// <reference types="node" />
import fs from 'fs';
import path from 'path';

const appDir = path.resolve(__dirname, '../../app');

const sourceFiles = (dir: string): string[] =>
  fs.readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === 'assets' ? [] : sourceFiles(full);
    }
    return /\.(ts|tsx|js)$/.test(entry.name) ? [full] : [];
  });

describe('product copy', () => {
  it('no longer mentions the old Eyy name', () => {
    const offenders = sourceFiles(appDir).flatMap(file =>
      fs
        .readFileSync(file, 'utf8')
        .split('\n')
        .map((line, i) => [line, i + 1] as const)
        .filter(([line]) => /\beyy\b/i.test(line))
        .map(
          ([line, n]) => `${path.relative(appDir, file)}:${n}: ${line.trim()}`,
        ),
    );

    expect(offenders).toEqual([]);
  });
});
