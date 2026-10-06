/// <reference types="node" />
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('OP-SQLite native integration', () => {
  it('pins the validated RN 0.87-compatible OP-SQLite line', () => {
    const pkg = JSON.parse(read('package.json'));
    expect(pkg.dependencies['@op-engineering/op-sqlite']).toBe('18.2.5');
  });

  it('opens the oto database behind the SqlDatabase boundary', () => {
    const source = read('app/storage/sqlite/openOtoDatabase.ts');
    expect(source).toContain("from '@op-engineering/op-sqlite'");
    expect(source).toContain("name: 'oto.sqlite'");
    expect(source).toContain('MigrationRunner');
  });
});
