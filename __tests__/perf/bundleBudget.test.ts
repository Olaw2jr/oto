/// <reference types="node" />
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');
const {checkBudgets} = require('../../scripts/perf/check-bundle-budget.js');

// HA-07: the shipped JS bundle and its assets stay within agreed sizes.
describe('bundle size budget', () => {
  const budgets = {bundleBytes: 3_000_000, assetsBytes: 1_500_000};

  it('passes within budget', () => {
    expect(checkBudgets({bundleBytes: 2_569_657, assetsBytes: 950_000}, budgets)).toEqual([]);
  });

  it('names what went over and by how much', () => {
    expect(checkBudgets({bundleBytes: 3_100_000, assetsBytes: 950_000}, budgets)).toEqual([
      'JS bundle is 3.10 MB, over its 3.00 MB budget by 0.10 MB',
    ]);
  });

  it('keeps the budgets in the repo and checks them in CI', () => {
    const file = JSON.parse(fs.readFileSync(path.join(root, 'perf-budgets.json'), 'utf8'));
    expect(file.android).toEqual(expect.objectContaining({bundleBytes: expect.any(Number), assetsBytes: expect.any(Number)}));
    expect(fs.readFileSync(path.join(root, '.github/workflows/ci.yml'), 'utf8')).toContain('npm run perf:bundle');
  });
});
