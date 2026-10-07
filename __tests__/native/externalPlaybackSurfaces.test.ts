/// <reference types="node" />
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('external playback surfaces', () => {
  it('serves a browsable Media3 library for Android Auto', () => {
    const service = read(
      'android/app/src/main/java/tz/co/oto/media/OtoMedia3PlaybackService.kt',
    );
    expect(service).toContain('onGetLibraryRoot');
    expect(service).toContain('onGetChildren');
    expect(service).toContain('setIsBrowsable(true)');
    expect(service).toContain('setIsPlayable(true)');
  });

  it('declares Android Auto media capability', () => {
    const manifest = read('android/app/src/main/AndroidManifest.xml');
    const descriptor = read(
      'android/app/src/main/res/xml/automotive_app_desc.xml',
    );
    expect(manifest).toContain(
      'com.google.android.gms.car.application',
    );
    expect(descriptor).toContain('<uses name="media"');
  });

  it('keeps CarPlay entitlement opt-in until Apple grants it', () => {
    const template = read(
      'ios/Eyy/Entitlements.carplay.template.plist',
    );
    const project = read('ios/Eyy.xcodeproj/project.pbxproj');
    expect(template).toContain(
      'com.apple.developer.carplay-audio',
    );
    expect(project).not.toContain(
      'Entitlements.carplay.template.plist',
    );
  });

  it('documents AirPlay and CarPlay platform behavior', () => {
    const docs = read('docs/platform/external-playback.md');
    expect(docs).toContain('AirPlay');
    expect(docs).toContain('Android Auto');
    expect(docs).toContain('CarPlay');
    expect(docs).toContain('managed entitlement');
  });
});
