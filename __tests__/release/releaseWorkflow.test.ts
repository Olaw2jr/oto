/// <reference types="node" />
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');
const {checkReleaseTag} = require('../../scripts/release/check-tag.js');

// H6 / HA-08: tagged releases build signed artifacts from secrets, with an
// SBOM, checksums and build provenance.
describe('release tag check', () => {
  it('accepts a tag that matches package.json', () => {
    expect(checkReleaseTag('v1.2.3', '1.2.3')).toBe('1.2.3');
    expect(checkReleaseTag('refs/tags/v1.2.3', '1.2.3')).toBe('1.2.3');
  });

  it('rejects a mismatched or malformed tag', () => {
    expect(() => checkReleaseTag('v1.2.4', '1.2.3')).toThrow(
      'Tag v1.2.4 does not match package.json version 1.2.3',
    );
    expect(() => checkReleaseTag('release-1', '1.2.3')).toThrow(
      'Release tags look like v1.2.3',
    );
  });
});

describe('release workflow', () => {
  const workflow = read('.github/workflows/release.yml');

  it('runs on version tags and can be started by hand', () => {
    expect(workflow).toMatch(/tags:\s*\[\s*'v\*\.\*\.\*'\s*\]/);
    expect(workflow).toContain('workflow_dispatch');
    expect(workflow).toContain('node scripts/release/check-tag.js');
  });

  it('builds a signed Android bundle from secrets and validates first', () => {
    expect(workflow).toContain('secrets.OTO_UPLOAD_KEYSTORE_BASE64');
    expect(workflow).toContain('npm run release:validate');
    expect(workflow).toContain(':app:bundleRelease');
    expect(workflow).toContain('OTO_BUILD_NUMBER: ${{ github.run_number }}');
  });

  it('archives and exports iOS with a temporary keychain', () => {
    expect(workflow).toContain('secrets.IOS_DIST_CERT_P12_BASE64');
    expect(workflow).toContain('secrets.IOS_PROVISIONING_PROFILE_BASE64');
    expect(workflow).toContain('xcodebuild -exportArchive');
    expect(workflow).toContain('security delete-keychain');
  });

  it('fails fast with a clear message when signing secrets are missing', () => {
    expect(workflow).toContain('docs/release/configuration.md');
    expect(workflow.match(/::error::/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it('publishes an SBOM, checksums and provenance with the release', () => {
    expect(workflow).toContain('anchore/sbom-action');
    expect(workflow).toContain('sha256sum');
    expect(workflow).toContain('actions/attest-build-provenance');
    expect(workflow).toContain('gh release create');
  });

  it('never contains secret values', () => {
    expect(workflow).not.toMatch(/PASSWORD:\s*['"][^$]/);
    expect(workflow).not.toMatch(/BEGIN (CERTIFICATE|PRIVATE KEY)/);
  });
});
