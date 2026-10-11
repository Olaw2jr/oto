# oto threat model (HA-05)

Scope: the oto mobile app (Android and iOS) as of October 2026. There is no
backend yet; sign-in is a local placeholder. Revisit when the backend (BE-01+)
and real accounts land.

## Assets

| Asset | Where it lives |
|---|---|
| Listening history, progress, ratings, shelves, bookmarks | SQLite `oto.sqlite` in app-private storage |
| Settings, session flag, search history, taste | AsyncStorage (app-private) |
| Telemetry waiting for the backend | SQLite `telemetry_events` (newest 500) |
| Streamed and cached audio | Media3 cache (512 MB LRU), `files/authorized-torrents` |
| Content rights | `RightsPolicy` and trusted-source allowlist |
| Future: account tokens | Must go in Keychain or Android Keystore, not AsyncStorage (BE-02) |

## Trust boundaries

1. **App ↔ internet (HTTPS):** catalogue and audio from trusted providers
   (Internet Archive / LibriVox), and the future oto API.
2. **App ↔ BitTorrent network:** peers and trackers are untrusted, and web seeds
   are fetched through `WebSeedProxy`.
3. **App ↔ loopback:** the torrent range server and the web seed proxy listen
   on `127.0.0.1` only.
4. **App ↔ other apps on the device:** the exported media session service,
   and the launcher activity.
5. **Device storage:** at rest, protected by OS sandboxing and file-based
   encryption.

## Threats and controls

| # | Threat (STRIDE) | Control in place | Gap / next step |
|---|---|---|---|
| T1 | **Tampering/Spoofing:** malicious audio source or swapped asset | `RightsPolicy` + trusted-source allowlist on every source; HTTPS-only source fetches; torrent pieces verified by SHA-1 piece hashes; HTTPS is preferred over torrent | Sign provider manifests when the catalogue moves to the backend |
| T2 | **Information disclosure:** cleartext traffic | Android network security config: release allows cleartext only to `127.0.0.1`/`localhost`; iOS ATS on, local networking only | Pin the oto API certificate once the domain exists |
| T3 | **Elevation:** another app uses oto's loopback servers | Range server and proxy bind to `127.0.0.1` with random ports; range routes use 192-bit tokens; the proxy forwards only to registered HTTPS seeds behind 192-bit tokens; GET/HEAD only; path traversal blocked | Any local app can still try to guess a port and token; acceptable given the token entropy |
| T4 | **Denial of service / storage exhaustion** | Streamed torrent files keep only requested pieces; torrents stop when a book ends; Media3 cache 512 MB LRU; telemetry capped at 500 events | Free-space checks and quotas for downloads (D5) |
| T5 | **Information disclosure:** data in backups | `android:allowBackup="false"` | Mark iOS files `NSURLIsExcludedFromBackupKey` where appropriate |
| T6 | **Information disclosure:** telemetry leaks personal data | `sanitizeProps` keeps short primitives only; messages and stacks truncated; no user identifiers | Review the event list when accounts exist |
| T7 | **Spoofing:** fake sign-in | Placeholder auth only; no tokens stored | BE-02: real auth, Keychain/Keystore token storage, short-lived tokens |
| T8 | **Tampering:** other apps control playback | The exported `MediaLibraryService` is required by Android media UI and Android Auto, and controllers can only play, pause or seek | Restrict browse results to the current library if browsing is added |
| T9 | **Repudiation / supply chain:** a vulnerable or malicious dependency | Dependabot, CodeQL (`security-extended`), dependency review on PRs, pinned native versions (jlibtorrent 2.0.12.9, Media3 1.11.1) | Turn on the Dependency graph and secret scanning; publish an SBOM per release (H6) |
| T10 | **Disclosure:** secrets in the repo | Signing inputs come from the environment only (`OTO_UPLOAD_*`, `OTO_IOS_TEAM_ID`); GitGuardian runs on PRs | Turn on GitHub push protection |

## Verification

- `__tests__/native/networkSecurity.test.ts`: cleartext only to loopback in
  release, ATS settings, backups off.
- `__tests__/native/androidTorrentNativeIntegration.test.ts`: loopback-only
  binding, token entropy, proxy rules.
- `__tests__/telemetry/telemetry.test.ts`: telemetry scrubbing.
