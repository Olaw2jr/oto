const fs = require('fs');
const path = require('path');

const packagePath = require.resolve('react-native-track-player/package.json');
const packageDir = path.dirname(packagePath);
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

if (packageJson.version !== '4.1.2') {
  throw new Error(
    `RNTP compatibility patch is pinned to 4.1.2, found ${packageJson.version}`,
  );
}

const target = path.join(
  packageDir,
  'android/src/main/java/com/doublesymmetry/trackplayer/module/MusicModule.kt',
);
let source = fs.readFileSync(target, 'utf8');

const replacements = [
  {
    pattern:
      /Arguments\.fromBundle\(musicService\.tracks\[index\]\.originalItem\)/g,
    replacement:
      'musicService.tracks[index].originalItem?.let { Arguments.fromBundle(it) }',
  },
  {
    pattern:
      /Arguments\.fromBundle\(\s*musicService\.tracks\[musicService\.getCurrentTrackIndex\(\)\]\.originalItem\s*\)/g,
    replacement:
      'musicService.tracks[musicService.getCurrentTrackIndex()].originalItem?.let { Arguments.fromBundle(it) }',
  },
];

let fixes = 0;
for (const {pattern, replacement} of replacements) {
  const matches = source.match(pattern)?.length ?? 0;
  if (matches > 1) {
    throw new Error(
      `RNTP compatibility patch matched an unexpected number of sites: ${matches}`,
    );
  }
  if (matches === 1) {
    source = source.replace(pattern, replacement);
    fixes += 1;
  } else if (source.includes(replacement)) {
    fixes += 1;
  }
}

if (fixes !== 2) {
  throw new Error(
    `Expected exactly 2 RNTP nullability fixes, confirmed ${fixes}`,
  );
}

fs.writeFileSync(target, source);
process.stdout.write('Applied RNTP 4.1.2 RN 0.87/Kotlin 2.2 compatibility patch\n');
