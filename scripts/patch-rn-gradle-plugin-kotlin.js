// Gradle 9.8 bundles Kotlin 2.4. React Native 0.87's Gradle plugin is
// compiled with Kotlin 2.2, which can't read Kotlin 2.4 metadata
// ("Module was compiled with an incompatible version of Kotlin"), so the
// Android build fails. Build the plugin with the Kotlin version Gradle
// embeds instead. Revisit on the next React Native upgrade.
const fs = require('fs');
const path = require('path');

const RN_PLUGIN_KOTLIN = '2.2.0';
const GRADLE_EMBEDDED_KOTLIN = '2.4.10';

const patchKotlinVersion = catalog => {
  const line = /^kotlin = "([^"]+)"$/m;
  const current = catalog.match(line)?.[1];
  if (current === GRADLE_EMBEDDED_KOTLIN) {
    return catalog;
  }
  if (current !== RN_PLUGIN_KOTLIN) {
    throw new Error(
      `React Native Gradle plugin patch expected Kotlin ${RN_PLUGIN_KOTLIN}, found ${current}`,
    );
  }
  return catalog.replace(line, `kotlin = "${GRADLE_EMBEDDED_KOTLIN}"`);
};

module.exports = {patchKotlinVersion, GRADLE_EMBEDDED_KOTLIN};

if (require.main === module) {
  const target = path.join(
    path.dirname(require.resolve('@react-native/gradle-plugin/package.json')),
    'gradle/libs.versions.toml',
  );
  fs.writeFileSync(target, patchKotlinVersion(fs.readFileSync(target, 'utf8')));
  process.stdout.write(
    `Built the React Native Gradle plugin with Kotlin ${GRADLE_EMBEDDED_KOTLIN} for Gradle 9.8\n`,
  );
}
