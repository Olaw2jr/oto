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
