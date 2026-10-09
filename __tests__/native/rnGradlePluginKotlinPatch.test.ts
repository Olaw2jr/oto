/// <reference types="node" />
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

// Gradle 9.8 bundles Kotlin 2.4; RN 0.87's Gradle plugin is built with
// Kotlin 2.2, which can't read 2.4 metadata, so the plugin is rebuilt
// with the Kotlin version Gradle embeds.
describe('React Native Gradle plugin Kotlin patch', () => {
  const {patchKotlinVersion, GRADLE_EMBEDDED_KOTLIN} =
    require('../../scripts/patch-rn-gradle-plugin-kotlin.js');

  it('runs the Android wrapper on Gradle 9.8', () => {
    expect(read('android/gradle/wrapper/gradle-wrapper.properties')).toContain(
      'gradle-9.8.0-bin.zip',
    );
    expect(GRADLE_EMBEDDED_KOTLIN).toBe('2.4.10');
  });

  it('patches after install, alongside the RNTP patch', () => {
    const pkg = JSON.parse(read('package.json'));
    expect(pkg.scripts.postinstall).toBe(
      'node scripts/patch-rntp-v4.js && node scripts/patch-rn-gradle-plugin-kotlin.js',
    );
  });

  it('moves only the plugin Kotlin version, and only from 2.2.0', () => {
    const catalog = 'agp = "9.2.1"\nkotlin = "2.2.0"\nktfmt = "0.22.0"\n';
    expect(patchKotlinVersion(catalog)).toBe(
      'agp = "9.2.1"\nkotlin = "2.4.10"\nktfmt = "0.22.0"\n',
    );
    // Already patched: unchanged.
    expect(patchKotlinVersion(patchKotlinVersion(catalog))).toBe(
      patchKotlinVersion(catalog),
    );
    // An RN upgrade with a different Kotlin needs this patch revisited.
    expect(() => patchKotlinVersion('kotlin = "2.3.0"\n')).toThrow(
      'expected Kotlin 2.2.0',
    );
  });
});
