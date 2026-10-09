// Fails a release unless the pushed tag matches package.json's version,
// e.g. tag v1.2.3 for version 1.2.3.
const checkReleaseTag = (ref, version) => {
  const tag = String(ref).replace(/^refs\/tags\//, '');
  const match = /^v(\d+\.\d+\.\d+)$/.exec(tag);
  if (!match) {
    throw new Error(`Release tags look like v1.2.3, got ${tag}`);
  }
  if (match[1] !== version) {
    throw new Error(`Tag ${tag} does not match package.json version ${version}`);
  }
  return version;
};

module.exports = {checkReleaseTag};

if (require.main === module) {
  const {version} = require('../../package.json');
  const ref = process.argv[2] || process.env.GITHUB_REF || '';
  try {
    process.stdout.write(`Releasing ${checkReleaseTag(ref, version)}\n`);
  } catch (error) {
    process.stderr.write(`::error::${error.message}\n`);
    process.exit(1);
  }
}
