/// <reference types="node" />
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('JavaScript runtime baseline', () => {
  it('pins the supported local runtime to Node 24 LTS', () => {
    expect(read('.nvmrc').trim()).toBe('24');
    expect(JSON.parse(read('package.json')).engines?.node).toBe('>=24 <25');
  });

  it('keeps the transitional RN 0.71 React peers deterministic', () => {
    const pkg = JSON.parse(read('package.json'));
    expect(pkg.dependencies.react).toBe('18.2.0');
    expect(pkg.devDependencies['react-test-renderer']).toBe('18.2.0');
  });

  it('uses current Node 24-based GitHub actions', () => {
    const workflow = read('.github/workflows/ci.yml');
    expect(workflow).toContain('actions/checkout@v7');
    expect(workflow).toContain('actions/setup-node@v7');
    expect(workflow).toContain('node-version-file: .nvmrc');
  });
});
