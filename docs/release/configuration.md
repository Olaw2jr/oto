# Release configuration

oto keeps release identity and secrets outside source control.

## Versioning

- `package.json#version` is the Android `versionName` and iOS `MARKETING_VERSION`.
- `OTO_BUILD_NUMBER` is the monotonically increasing Android `versionCode`.
- For iOS archives, pass the same value as `CURRENT_PROJECT_VERSION` to `xcodebuild`.

## Environments

Supported values are `development`, `staging`, and `production`.

Android accepts `-POTO_ENVIRONMENT=staging` or the `OTO_ENVIRONMENT` environment variable. Debug defaults to development and release defaults to production.

Xcode Debug defaults to development and Release defaults to production. Command-line build settings have highest precedence, so staging archives can pass `OTO_ENVIRONMENT=staging`.

## Android signing

Production validation expects:

- `OTO_UPLOAD_STORE_FILE`
- `OTO_UPLOAD_STORE_PASSWORD`
- `OTO_UPLOAD_KEY_ALIAS`
- `OTO_UPLOAD_KEY_PASSWORD`

The Gradle build also accepts the same names as Gradle project properties.

## iOS signing

Pass `OTO_IOS_TEAM_ID` as an Xcode build setting for archive/signing jobs. Certificates and provisioning profiles remain CI/keychain inputs.

## Secret handling

Do not commit keystores, passwords, certificates, provisioning profiles, or CI secret values. Keep them in the platform secret store and inject them only in release jobs.

Run `npm run release:validate` before production packaging.

## Backend URL and telemetry

`app/config/environment.ts#apiBaseUrl` is the base URL of the oto backend
([oto-api](https://github.com/Olaw2jr/oto-api)). It must be HTTPS, apart
from `http://localhost` or `http://127.0.0.1` for a backend on your machine.

While it is `null`, nothing leaves the device:
- telemetry (uncaught errors, playback failures, storage write failures)
  stays in a bounded on-device queue (newest 500 events in SQLite);
- library, progress, shelf and rating changes aren't recorded for sync;
- the sign-in buttons keep their local behaviour.

Once it is set:
- telemetry is sent in batches to `POST {apiBaseUrl}/v1/telemetry`, retried
  with backoff (`docs/architecture/telemetry.md`);
- changes are queued in the SQLite outbox and sent to
  `POST /v1/sync/mutations` while an oto-api account is signed in;
- tokens are kept in the iOS Keychain or Android's Keystore-backed storage.

### Sign-in

- **Google:** set `googleWebClientId`, the OAuth web client id that oto-api
  checks ID tokens against (`OAUTH_GOOGLE_CLIENT_ID` there).
  - **iOS:** also set `googleIosClientId`, and add its reversed client id as
    a URL scheme in `ios/oto/Info.plist`.
  - **Android:** register the signing certificate's SHA-1 for both the debug
    and upload keys in the Google Cloud console.
  
  Until the web client id is set, the Google button signs in locally.
- **Developer sign-in:** against a development oto-api started with
  `DEV_LOGIN=true` and seeded with `python -m app.seed`, the sign-in screen
  lists the seeded readers to sign in as. oto-api never offers this in
  production.

## Cutting a release (H6)

1. Bump `package.json#version` (for example `1.0.0`) and merge to `main`.
2. Tag the commit and push the tag: `git tag v1.0.0 && git push origin v1.0.0`.
3. `.github/workflows/release.yml` then:
   - checks the tag matches `package.json`;
   - builds a signed Android AAB and APK (`versionCode` = workflow run number);
   - archives and exports a signed iOS IPA;
   - attests build provenance for every artifact;
   - publishes a GitHub Release with the artifacts, a CycloneDX SBOM
     (`oto-<version>.sbom.cdx.json`) and `SHA256SUMS.txt`.

It can also be re-run for an existing tag from the Actions tab
(`workflow_dispatch` with `tag`).

### Repository secrets

| Secret | What it is |
|---|---|
| `OTO_UPLOAD_KEYSTORE_BASE64` | The Android upload keystore, base64-encoded (`base64 -i upload.keystore`) |
| `OTO_UPLOAD_STORE_PASSWORD` | Keystore password |
| `OTO_UPLOAD_KEY_ALIAS` | Upload key alias |
| `OTO_UPLOAD_KEY_PASSWORD` | Upload key password |
| `IOS_DIST_CERT_P12_BASE64` | Apple Distribution certificate and key as a `.p12`, base64-encoded |
| `IOS_DIST_CERT_PASSWORD` | Password of that `.p12` |
| `IOS_PROVISIONING_PROFILE_BASE64` | App Store provisioning profile for `tz.co.oto`, base64-encoded |
| `OTO_IOS_TEAM_ID` | Apple Developer Team ID |

Until these are added, the Android and iOS jobs stop at their first step with
an error naming the missing secrets. The keystore, certificate and profile
are written only to the runner's temporary directory and removed after use;
the iOS certificate lives in a throwaway keychain that is deleted even when
the job fails.
