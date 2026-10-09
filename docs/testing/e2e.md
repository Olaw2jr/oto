# End-to-end tests (HA-03)

Maestro flows in `.maestro/` cover the critical paths:

| Flow | What it checks |
|---|---|
| `01-sign-in.yaml` | Onboarding, sign in, and Home continuing the playable public-domain sample |
| `02-play-sample.yaml` | Search for the sample, open it, play over the network, pause |
| `03-shelves.yaml` | Create, rename and delete a shelf |

## CI

`.github/workflows/e2e-android.yml` builds a release APK (JS bundled, signed
with the debug keystore for testing), boots an API 34 x86_64 emulator and runs
`maestro test .maestro --include-tags smoke`. It runs nightly, by hand, and on
PRs that change the flows. The JUnit report and Maestro debug output
(screenshots, logs) are uploaded as the `maestro-results` artifact.

## Locally

Install Maestro (`curl -fsSL https://get.maestro.mobile.dev | bash`), install a
build on an emulator or a test device that nobody is using, then run
`maestro test .maestro`. Flow 01 clears the app's data.
