/// <reference types="node" />
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('RNTP v4 RN 0.87 compatibility patch', () => {
  it('runs a pinned compatibility patch after npm installs dependencies', () => {
    const pkg = JSON.parse(read('package.json'));
    expect(pkg.dependencies['react-native-track-player']).toBe('4.1.2');
    expect(pkg.scripts.postinstall).toBe(
      'node scripts/patch-rntp-v4.js',
    );
  });

  it('patches only the two nullable originalItem conversions', () => {
    const patch = read('scripts/patch-rntp-v4.js');
    expect(patch).toContain("version !== '4.1.2'");
    expect(patch).toContain('originalItem?.let');
    expect(patch).toContain('Expected exactly 2 RNTP nullability fixes');
  });
});
