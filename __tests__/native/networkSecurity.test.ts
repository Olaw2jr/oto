/// <reference types="node" />
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

// HA-05: release builds allow no cleartext traffic except to oto's own
// loopback servers (torrent range server, web seed proxy). Without this,
// release Media3 couldn't read http://127.0.0.1 torrent streams.
describe('Android network security', () => {
  it('points the app at a network security config', () => {
    expect(read('android/app/src/main/AndroidManifest.xml')).toContain(
      'android:networkSecurityConfig="@xml/network_security_config"',
    );
  });

  it('allows cleartext in release only to loopback', () => {
    const release = read('android/app/src/main/res/xml/network_security_config.xml');
    expect(release).toMatch(/<base-config cleartextTrafficPermitted="false"/);
    expect(release).toMatch(
      /<domain-config cleartextTrafficPermitted="true">[\s\S]*<domain includeSubdomains="false">127\.0\.0\.1<\/domain>[\s\S]*<domain includeSubdomains="false">localhost<\/domain>[\s\S]*<\/domain-config>/,
    );
    // Only those two hosts.
    expect(release.match(/<domain /g)).toHaveLength(2);
  });

  it('keeps debug builds able to reach Metro', () => {
    const debug = read('android/app/src/debug/res/xml/network_security_config.xml');
    expect(debug).toMatch(/<base-config cleartextTrafficPermitted="true"/);
  });

  it('keeps iOS App Transport Security on, with local networking for loopback', () => {
    const plist = read('ios/Eyy/Info.plist');
    expect(plist).toMatch(/<key>NSAllowsArbitraryLoads<\/key>\s*<false\/>/);
    expect(plist).toMatch(/<key>NSAllowsLocalNetworking<\/key>\s*<true\/>/);
  });

  it('keeps app data out of device backups', () => {
    expect(read('android/app/src/main/AndroidManifest.xml')).toContain(
      'android:allowBackup="false"',
    );
  });
});
