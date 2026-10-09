# Operations runbook (HA-09)

oto is a mobile app with no backend yet, so operations today mean releases,
rollbacks and on-device data. Extend this when the backend ships.

## Release checklist

1. `main` is green: CI, Android CI, iOS CI, CodeQL and the nightly
   **E2E (Android)** run.
2. Run the manual accessibility checklist (`docs/accessibility.md`) and the
   device checks in `docs/architecture/issue-82-verification.md` on one
   Android phone and one iPhone.
3. Bump `package.json#version`, tag `vX.Y.Z` and push the tag
   (`docs/release/configuration.md`).
4. Check the GitHub Release has the AAB, APK, IPA, `SHA256SUMS.txt` and the
   SBOM, and that provenance attestations exist (`gh attestation verify`).
5. Upload to Play internal testing and TestFlight, then use a staged rollout
   (10% → 50% → 100%) on Play.

## Rolling back

Mobile releases can't be pulled from devices, so roll forward fast and stop
the spread:

- **Play:** halt the staged rollout in Play Console (Release → Halt rollout).
  Ship a fix as a new version with a higher `versionCode`; Play doesn't allow
  downgrading `versionCode`.
- **App Store:** pause phased release, or remove the version from sale if
  it's severe, then submit a fix for expedited review.
- **Database migrations:** they only move forward. A broken migration is fixed
  in a newer migration, never by editing a shipped one. The runner applies
  each migration in a transaction, so a failure leaves the previous schema
  intact and the app shows "Could not open your library. Your saved data has
  been kept." with a Retry button.

## Incident triage

| Symptom | Where to look | First steps |
|---|---|---|
| Crashes after a release | Play Console vitals / Xcode Organizer; telemetry `error` events with `fatal: true` once the backend is live | Halt rollout; reproduce with the release APK from the GitHub Release |
| "This book isn't available" for books that should play | Telemetry `playback.failed` with `reason: unavailable` | Check the rights data and the trusted-source allowlist |
| "Playback stopped. Check your connection…" spikes | Telemetry `playback.stopped` | Check the Internet Archive status; torrent sources fall back only when no HTTPS source exists |
| Storage complaints | `files/authorized-torrents`, Media3 cache (512 MB) | Streams keep only requested pieces and torrents stop when a book ends (#138); downloads quotas are D5 |
| Library won't open | Retry screen on launch | Usually a failed migration; ship a fix migration |

## Backup and restore

- Listening data lives only on the device in `oto.sqlite`. Android backups
  are off (`allowBackup="false"`), so reinstalling starts fresh until the
  backend sync (BE-05/BE-06) exists.
- Pending changes wait in the SQLite outbox and survive restarts. They will
  sync once a backend sender exists.

## Service levels (proposed, to adopt with the backend)

| Indicator | Objective |
|---|---|
| Crash-free sessions | ≥ 99.5% |
| Playback starts within 5 s (HTTPS) | ≥ 95% |
| Playback failures per 1,000 plays (excluding unavailable rights) | ≤ 5 |
| Telemetry delivered within 24 h of reconnecting | ≥ 99% |

## Performance budgets

`perf-budgets.json`, checked in CI by `npm run perf:bundle`:

- Android JS bundle ≤ 3.0 MB (2.57 MB at 0.0.1).
- Bundled assets ≤ 1.5 MB (0.84 MB).

Raise a budget only in a PR that explains why.
