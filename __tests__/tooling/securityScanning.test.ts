/// <reference types="node" />
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

// HA-04: dependency, code and supply-chain scanning.
describe('security scanning', () => {
  it('keeps npm, Gradle, Bundler and Actions dependencies updated', () => {
    const config = read('.github/dependabot.yml');
    for (const ecosystem of ['npm', 'gradle', 'bundler', 'github-actions']) {
      expect(config).toContain(`package-ecosystem: ${ecosystem}`);
    }
  });

  it('runs CodeQL on TypeScript and workflows', () => {
    const workflow = read('.github/workflows/codeql.yml');
    expect(workflow).toContain('github/codeql-action/init@v4');
    expect(workflow).toContain('javascript-typescript');
    expect(workflow).toContain('actions');
    expect(workflow).toContain('security-events: write');
  });

  it('blocks pull requests that add high-severity vulnerable dependencies', () => {
    const workflow = read('.github/workflows/dependency-review.yml');
    expect(workflow).toContain('actions/dependency-review-action@v5');
    expect(workflow).toContain('fail-on-severity: high');
  });
});
