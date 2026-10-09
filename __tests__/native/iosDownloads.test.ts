/// <reference types="node" />
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

// D3: iOS downloads with a background URLSession, played as local files.
describe('iOS downloads', () => {
  const module = () => read('ios/OtoNative/OtoDownloads.m');

  it('ships as a local pod linked into the app', () => {
    expect(read('ios/OtoNative/OtoNative.podspec')).toContain('install_modules_dependencies(s)');
    expect(read('ios/Podfile')).toContain("pod 'OtoNative', :path => './OtoNative'");
  });

  it('downloads in a background session that survives suspension', () => {
    expect(module()).toContain('SessionIdentifier = @"tz.co.oto.downloads"');
    expect(module()).toContain('backgroundSessionConfigurationWithIdentifier:SessionIdentifier');
    expect(module()).toContain('sessionSendsLaunchEvents = YES');
  });

  it('honours Wi-Fi only per request', () => {
    expect(module()).toContain('allowsCellularAccess = !');
  });

  it('keeps finished files out of iCloud backups', () => {
    expect(module()).toContain('NSURLIsExcludedFromBackupKey');
    expect(module()).toContain('NSApplicationSupportDirectory');
  });

  it('exposes the same bridge as Android and plays completed files locally', () => {
    for (const method of ['start:', 'remove:', 'setWifiOnly:', 'list:', 'playbackSource:']) {
      expect(module()).toContain(`RCT_EXPORT_METHOD(${method}`);
    }
    expect(module()).toContain('RCT_EXPORT_MODULE(OtoDownloads)');
    expect(module()).toContain('@"oto-downloads"');
    expect(module()).toContain('@"kind": @"local"');
  });

  it('finishes background sessions the system woke the app for', () => {
    const delegate = read('ios/Eyy/AppDelegate.swift');
    expect(delegate).toContain('handleEventsForBackgroundURLSession');
    expect(delegate).toContain('OtoDownloadsBackgroundEvents');
    expect(module()).toContain('OtoDownloadsBackgroundEvents');
    expect(module()).toContain('URLSessionDidFinishEventsForBackgroundURLSession');
  });
});
