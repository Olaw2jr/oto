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

`app/config/environment.ts#apiBaseUrl` is the oto backend's base URL. It is
`null` until the backend exists. While it is null, telemetry (uncaught errors,
playback failures, storage write failures) stays in a bounded on-device queue
(newest 500 events in SQLite) and nothing is uploaded. Once it is set, queued
events are sent in batches to `POST {apiBaseUrl}/v1/telemetry` while online,
retried with backoff. See `docs/architecture/telemetry.md`.

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
