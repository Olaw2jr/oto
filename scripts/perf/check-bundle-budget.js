// Builds the production Android JS bundle and fails if it, or its assets,
// exceed the budgets in perf-budgets.json (HA-07).
const fs = require('fs');
const os = require('os');
const path = require('path');
const {execFileSync} = require('child_process');

const mb = bytes => (bytes / 1_000_000).toFixed(2);

const checkBudgets = (sizes, budgets) => {
  const over = [];
  const check = (label, size, budget) => {
    if (size > budget) {
      over.push(
        `${label} is ${mb(size)} MB, over its ${mb(budget)} MB budget by ${mb(size - budget)} MB`,
      );
    }
  };
  check('JS bundle', sizes.bundleBytes, budgets.bundleBytes);
  check('Bundled assets', sizes.assetsBytes, budgets.assetsBytes);
  return over;
};

const directorySize = dir =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir, {withFileTypes: true}).reduce((total, entry) => {
        const full = path.join(dir, entry.name);
        return total + (entry.isDirectory() ? directorySize(full) : fs.statSync(full).size);
      }, 0)
    : 0;

module.exports = {checkBudgets};

if (require.main === module) {
  const root = path.resolve(__dirname, '../..');
  const budgets = require(path.join(root, 'perf-budgets.json')).android;
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'oto-bundle-'));
  const bundle = path.join(out, 'index.android.bundle');
  const assets = path.join(out, 'assets');
  execFileSync(
    'npx',
    ['react-native', 'bundle', '--platform', 'android', '--dev', 'false', '--minify', 'true',
      '--entry-file', 'index.js', '--bundle-output', bundle, '--assets-dest', assets],
    {cwd: root, stdio: 'inherit'},
  );
  const sizes = {bundleBytes: fs.statSync(bundle).size, assetsBytes: directorySize(assets)};
  const over = checkBudgets(sizes, budgets);
  process.stdout.write(
    `JS bundle ${mb(sizes.bundleBytes)} / ${mb(budgets.bundleBytes)} MB, assets ${mb(sizes.assetsBytes)} / ${mb(budgets.assetsBytes)} MB\n`,
  );
  fs.rmSync(out, {recursive: true, force: true});
  if (over.length) {
    over.forEach(line => process.stderr.write(`::error::${line}\n`));
    process.exit(1);
  }
}
